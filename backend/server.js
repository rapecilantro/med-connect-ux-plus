require('dotenv').config(); // Load environment variables first
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
// @ts-ignore - No types available for express-validation
const { validate, Joi, ValidationError } = require('express-validation');
const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');
// @ts-ignore - Ignore if @types/winston not found/working
const winston = require('winston'); // Use require for winston
const cookieParser = require('cookie-parser');

// --- Type Imports for JSDoc ---
/**
 * @typedef {import('express').Request} ExpressRequest
 * @typedef {import('express').Response} ExpressResponse
 * @typedef {import('express').NextFunction} NextFunction
 * @typedef {import('@supabase/supabase-js').User} SupabaseUser
 * @typedef {import('express-serve-static-core').ParamsDictionary} ParamsDictionary
 * @typedef {import('qs').ParsedQs} ParsedQs
 * @typedef {import('pg').QueryResult<any>} QueryResult
 */

// --- Custom Request Type ---
/**
 * @typedef {object} AuthenticatedUser
 * @property {string} id - Supabase User ID (UUID)
 * @property {string} email
 * @property {'basic' | 'premium' | 'expert' | null} [tier]
 * @property {string} requestId
 */
/**
 * Represents an Express Request augmented with custom properties.
 * @typedef {ExpressRequest & { id: string, user?: AuthenticatedUser }} CustomRequest
 */


// --- Logging Configuration ---
// @ts-ignore - Ignore if @types/winston not found/working
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    // @ts-ignore
    winston.format.timestamp(),
    // @ts-ignore
    winston.format.json()
  ),
  defaultMeta: { service: 'rx-provider-service' },
  transports: [
    // @ts-ignore
    new winston.transports.Console({ format: winston.format.simple() }),
    // @ts-ignore
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // @ts-ignore
    new winston.transports.File({ filename: 'combined.log' })
  ],
});
logger.info('Logger configured.'); // Log early

// --- Environment Validation ---
const requiredEnvVars = [
  'VITE_SUPABASE_URL', 'VITE_SUPABASE_SERVICE_ROLE_KEY',
  'DB_USER', 'DB_HOST', 'DB_DATABASE', 'DB_PASSWORD'
];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}
logger.info('Environment variables validated.');

// --- Initialize Express Application ---
const app = express();
const PORT = process.env.PORT || 4242; // Ensure this matches proxy_pass port
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// If running behind a trusted proxy (e.g., Nginx, Load Balancer)
// Set this to the number of proxies or true if you trust the X-Forwarded-For header
// This is important for express-rate-limit and other IP-dependent middleware
app.set('trust proxy', 1); // Adjust as needed (e.g., 'loopback', '127.0.0.1', or true)
logger.info(`Express app initialized. 'trust proxy' set to 1.`);


// --- Middleware Stack ---
app.use(helmet.default());
app.use(compression());
app.use(morgan(isProduction ? 'combined' : 'dev', {
  stream: { write: (/** @type {string} */ message) => logger.info(message.trim()) }
}));
app.use(cors({
  origin: isProduction ? ['http://rxprescribers.com', process.env.ALLOWED_ORIGINS || ''] : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}));
app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
logger.info('Core middleware configured.');

// @ts-ignore - Ignore rateLimit type issue if types conflict
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', apiLimiter);
logger.info('Rate limiter configured.');

/** @type {import('express').RequestHandler} */
app.use((req, res, next) => {
  const customReq = /** @type {CustomRequest} */ (req);
  customReq.id = uuidv4();
  res.setHeader('X-Request-ID', customReq.id);
  next();
});
logger.info('Request ID middleware configured.');

// --- Services Initialization ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
/** @type {import('@supabase/supabase-js').SupabaseClient} */
let supabase;
try {
  if (!supabaseUrl || !supabaseServiceRoleKey) throw new Error('Supabase URL or Service Role Key missing.');
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } });
  logger.info('Supabase client initialized successfully');
} catch (error) {
  const err = /** @type {Error} */ (error);
  logger.error('Failed to initialize Supabase client', { error: err.message });
  process.exit(1);
}

let pool; // Define pool outside try block
try {
    pool = new Pool({ // Assign inside try block
      user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD, port: parseInt(process.env.DB_PORT || '5432', 10),
      max: parseInt(process.env.DB_POOL_MAX || '20', 10), idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000, ssl: isProduction ? { rejectUnauthorized: false } : false // Adjust SSL based on DB requirements
    });
    pool.on('connect', (/** @type {import('pg').PoolClient} */ client) => { logger.debug('New client connected'); });
    pool.on('error', (/** @type {Error} */ err, /** @type {import('pg').PoolClient} */ client) => { logger.error('Idle client error', { error: err.message }); });
    pool.on('remove', (/** @type {import('pg').PoolClient} */ client) => { logger.debug('Client removed'); });
    logger.info('PostgreSQL pool configured'); // Add log after config
} catch (error) {
    const err = /** @type {Error} */ (error);
    logger.error('Failed to configure PostgreSQL pool', { error: err.message, stack: err.stack });
    process.exit(1); // Exit if pool config fails
}


// --- Validation Schemas ---
const findProvidersSchema = {
  body: Joi.object({
    drugName: Joi.string().required(), radiusMiles: Joi.number().min(1).max(100).default(10),
    minClaims: Joi.number().min(0).default(0), taxonomyClass: Joi.string().allow(null, ''),
    sortBy: Joi.string().valid('distance', 'claims', 'name').default('distance'),
    locationName: Joi.string().allow(null, ''), zipCode: Joi.string().pattern(/^\d{5}$/).allow(null, ''),
    acceptedInsurance: Joi.array().items(Joi.string()).optional(), minRating: Joi.number().min(0).max(5).optional(),
    cursor: Joi.number().integer().min(0).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
};
const addLocationSchema = { body: Joi.object({ name: Joi.string().required(), zipCode: Joi.string().pattern(/^\d{5}$/).required() }) };
const drugSuggestionsSchema = { query: Joi.object({ q: Joi.string().min(2).required() }) }; // Validation for drug suggestions query
logger.info('Validation schemas defined.');

// --- Authentication Middleware ---
/** @type {import('express').RequestHandler} */
const authenticateToken = async (req, res, next) => {
  const customReq = /** @type {CustomRequest} */ (req);
  const requestId = customReq.id; logger.debug('Processing authentication', { requestId });
  const authHeader = req.headers['authorization']; const token = authHeader && authHeader.split(' ')[1];
  const cookieToken = req.cookies['auth_token'];
  if (!token && !cookieToken) { logger.warn('Auth failed: No token', { requestId }); res.status(401).json({ error: "Auth token required" }); return; }
  const authToken = token || cookieToken;
  try {
    const { data: { user }, error } = await supabase.auth.getUser(authToken);
    if (error || !user) {
      logger.warn('Auth failed: Invalid token', { requestId, error: error?.message || 'User not found' });
      if (cookieToken) res.clearCookie('auth_token'); res.status(403).json({ error: "Invalid or expired token" }); return;
    }
    customReq.user = { id: user.id, email: user.email || 'N/A', requestId };
    logger.info('User authenticated', { requestId, userId: user.id }); next();
  } catch (err) {
    const error = /** @type {Error} */ (err);
    logger.error('Auth error', { requestId, error: error.message, stack: error.stack });
    res.status(500).json({ error: "Internal server error during authentication" });
  }
};
logger.info('Auth middleware defined.');

// --- Role-based Access Control Middleware ---
/**
 * @param {Array<'basic' | 'premium' | 'expert'>} allowedTiers
 * @returns {import('express').RequestHandler}
 */
const requireTier = (allowedTiers) => {
  /** @type {import('express').RequestHandler} */
  return async (req, res, next) => {
    const customReq = /** @type {CustomRequest} */ (req);
    const { user } = customReq; if (!user) { res.status(401).json({ error: "User not authenticated" }); return; }
    try {
      const userTier = user.tier || await userService.getUserTier(user.id); user.tier = userTier;
      if (!userTier || !allowedTiers.includes(userTier)) {
        logger.warn('Access denied: insufficient tier', { userId: user.id, required: allowedTiers, actual: userTier });
        res.status(403).json({ error: "Access denied: Insufficient membership tier." }); return;
      } next();
    } catch (err) {
      const error = /** @type {Error} */ (err);
      logger.error('RBAC error', { userId: user.id, error: error.message });
      res.status(500).json({ error: "Internal server error checking permissions." });
    }
  };
};
logger.info('RBAC middleware defined.');

// --- Service Layer ---
const userService = {
  /** @param {string} userId */
  async getUserTier(userId) {
    logger.debug('Fetching user tier', { userId });
    const { data, error } = await supabase.from('profiles').select('membership_tier').eq('id', userId).single();
    if (error && error.code !== 'PGRST116') { logger.error('Supabase fetch tier error', { userId, error: error.message }); throw error; }
    if (!data) { logger.warn('User profile not found', { userId }); return null; }
    return /** @type {'basic' | 'premium' | 'expert' | null} */ (data.membership_tier);
  },
  /**
   * @param {string} userId
   * @param {{ locationName?: string, isPrimary?: boolean }} options
   */
  async getUserLocation(userId, options = {}) {
    const { locationName, isPrimary = false } = options; logger.debug('Fetching user location', { userId, locationName, isPrimary });
    const client = await pool.connect();
    try {
      let queryText = 'SELECT zip_code, location_name FROM user_locations WHERE user_id = $1'; const queryParams = [userId];
      if (isPrimary) { queryText += ' AND is_primary = true'; }
      if (locationName) { queryText += ' AND location_name = $2'; queryParams.push(locationName); }
      queryText += ' LIMIT 1';
      const { rows } = await client.query(queryText, queryParams);
      if (rows.length === 0) throw new Error(locationName ? `Location '${locationName}' not found` : 'Primary location not found');
      return rows[0];
    } catch (err) {
      const error = /** @type {Error} */ (err); logger.error('DB fetch location error', { userId, error: error.message }); throw error;
    } finally { client.release(); }
  }
};

const providerService = {
  /** @param {any} params */
  async findProviders(params) {
    const { zipCode, drugName, radiusMiles, minClaims, taxonomyClass, sortBy, acceptedInsurance, minRating, cursor = 0, limit = 10, requestId } = params;
    const offset = typeof cursor === 'number' ? cursor : 0;
    const radiusMeters = radiusMiles * 1609.34;

    logger.debug('Finding providers', { requestId, zipCode, drugName, radiusMiles, limit, offset });
    const client = await pool.connect();
    try {
        const zipResult = await client.query('SELECT geom FROM us_zipcodes WHERE zip_code = $1 LIMIT 1', [zipCode]);
        if (zipResult.rows.length === 0) { throw new Error(`Coordinates not found for zip code ${zipCode}`); }
        const searchGeom = zipResult.rows[0].geom;

        let queryParams = [searchGeom, radiusMeters, drugName, minClaims];
        let paramIndex = 5;
        let baseQuery = `
            FROM npi_details nd
            JOIN npi_addresses na ON nd.npi = na.npi
            JOIN npi_prescriptions np ON nd.npi = np.npi
            JOIN us_zipcodes uz ON na.provider_business_practice_location_address_postal_code = uz.zip_code
            WHERE ST_DWithin(uz.geom, $1, $2)
              AND (np.drug_name ILIKE $3 OR np.generic_name ILIKE $3)
              AND np.total_claim_count >= $4
        `;
        if (taxonomyClass) {
            baseQuery += ` AND nd.healthcare_provider_taxonomy_1_classification ILIKE $${paramIndex}`;
            queryParams.push(`%${taxonomyClass}%`); paramIndex++;
        }
        // TODO: Add acceptedInsurance filter
        // TODO: Add minRating filter

        const countQuery = `SELECT COUNT(DISTINCT nd.npi) as total_count ${baseQuery}`;
        const countResult = await client.query(countQuery, queryParams);
        const totalCount = parseInt(countResult.rows[0]?.total_count || '0', 10);

        let finalQuery = `
            SELECT DISTINCT
                nd.npi, nd.provider_first_name, nd.provider_last_name_legal_name as provider_last_name,
                nd.provider_credential_text, nd.healthcare_provider_taxonomy_1_classification, nd.healthcare_provider_taxonomy_1_specialization,
                na.provider_first_line_business_practice_location_address as address_line_1, na.provider_second_line_business_practice_location_address as address_line_2,
                na.provider_business_practice_location_address_city_name as city, na.provider_business_practice_location_address_state_name as state,
                na.provider_business_practice_location_address_postal_code as postal_code, na.provider_business_practice_location_address_telephone_number as phone,
                ST_X(uz.geom) as longitude, ST_Y(uz.geom) as latitude, ST_Distance(uz.geom, $1) as distance_meters, np.total_claim_count
            ${baseQuery}
        `;
        switch (sortBy) {
            case 'claims': finalQuery += ` ORDER BY np.total_claim_count DESC, distance_meters ASC`; break;
            case 'name': finalQuery += ` ORDER BY provider_last_name_legal_name ASC, provider_first_name ASC, distance_meters ASC`; break;
            case 'distance': default: finalQuery += ` ORDER BY distance_meters ASC`; break;
        }
        finalQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit); queryParams.push(offset);

        const results = await client.query(finalQuery, queryParams);
        logger.info(`Provider search completed`, { requestId, resultCount: results.rows.length, totalCount });

        const nextOffset = offset + results.rows.length;
        const nextCursor = nextOffset < totalCount ? nextOffset : null;

        const formattedData = results.rows.map(row => ({
            id: row.npi.toString(), npi: row.npi.toString(),
            name: `${row.provider_first_name || ''} ${row.provider_last_name || ''}`.trim(),
            first_name: row.provider_first_name, last_name: row.provider_last_name,
            title: row.provider_credential_text || '',
            specialties: [row.healthcare_provider_taxonomy_1_classification, row.healthcare_provider_taxonomy_1_specialization].filter(Boolean),
            city: row.city, state: row.state,
            location: `${row.address_line_1 || ''}${row.address_line_2 ? ', ' + row.address_line_2 : ''}, ${row.city || ''}, ${row.state || ''} ${row.postal_code || ''}`.replace(/^, |, $/g, '').trim(),
            rating: row.rating || 0, review_count: row.review_count || 0, availability: 'N/A', // Placeholders
            latitude: row.latitude, longitude: row.longitude,
        }));
        return { data: formattedData, totalCount, nextCursor };
    } finally { client.release(); }
  },

  /**
   * @param {string} providerId (NPI)
   * @param {string} requestId
   */
  async getProviderDetails(providerId, requestId) {
    logger.debug('Fetching provider details', { requestId, providerId });
    const client = await pool.connect();
    try {
      const query = `
        SELECT
            nd.npi, nd.provider_first_name, nd.provider_last_name_legal_name as provider_last_name, nd.provider_credential_text,
            nd.healthcare_provider_taxonomy_1_classification, nd.healthcare_provider_taxonomy_1_specialization,
            na.provider_first_line_business_practice_location_address as address_line_1, na.provider_second_line_business_practice_location_address as address_line_2,
            na.provider_business_practice_location_address_city_name as city, na.provider_business_practice_location_address_state_name as state,
            na.provider_business_practice_location_address_postal_code as postal_code, na.provider_business_practice_location_address_telephone_number as phone,
            ST_X(uz.geom) as longitude, ST_Y(uz.geom) as latitude,
            (SELECT json_agg(json_build_object('id', np.prescription_id, 'name', np.drug_name, 'genericName', np.generic_name))
             FROM npi_prescriptions np WHERE np.npi = nd.npi) as prescribed_medications
        FROM npi_details nd
        LEFT JOIN npi_addresses na ON nd.npi = na.npi
        LEFT JOIN us_zipcodes uz ON na.provider_business_practice_location_address_postal_code = uz.zip_code
        WHERE nd.npi = $1 LIMIT 1;`;
      const { rows } = await client.query(query, [providerId]);
      if (rows.length === 0) { logger.warn('Provider not found', { requestId, providerId }); return null; }

      const row = rows[0];
      const formattedProvider = {
            id: row.npi.toString(), npi: row.npi.toString(),
            name: `${row.provider_first_name || ''} ${row.provider_last_name || ''}`.trim(),
            first_name: row.provider_first_name, last_name: row.provider_last_name,
            title: row.provider_credential_text || '',
            specialties: [row.healthcare_provider_taxonomy_1_classification, row.healthcare_provider_taxonomy_1_specialization].filter(Boolean),
            city: row.city, state: row.state,
            location: `${row.address_line_1 || ''}${row.address_line_2 ? ', ' + row.address_line_2 : ''}, ${row.city || ''}, ${row.state || ''} ${row.postal_code || ''}`.replace(/^, |, $/g, '').trim(),
            rating: row.rating || 0, review_count: row.review_count || 0, availability: 'N/A', // Placeholders
            latitude: row.latitude, longitude: row.longitude, phone: row.phone, bio: row.bio || null, // Placeholder
            prescribed_medications: row.prescribed_medications || [],
      };
      logger.info('Provider details fetched', { requestId, providerId }); return formattedProvider;
    } finally { client.release(); }
  }
};
logger.info('Service layer defined.');

// --- API Routes ---
/** @type {import('express').RequestHandler} */
const healthCheckHandler = (req, res) => { res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), environment: NODE_ENV }); };
app.get('/health', healthCheckHandler);

/** @type {import('express').RequestHandler} */
const findProvidersHandler = async (req, res) => {
    const customReq = /** @type {CustomRequest} */ (req); const requestId = customReq.id; const userId = customReq.user?.id;
    if (!userId) { res.status(401).json({ error: "User not authenticated" }); return; }
    logger.info('Processing find-providers', { requestId, userId });
    const { drugName, radiusMiles, minClaims, taxonomyClass, sortBy, locationName, zipCode, acceptedInsurance, minRating, cursor, limit } = req.body;
    try {
      const userTier = await userService.getUserTier(userId); logger.info('User tier', { requestId, userId, userTier });
      let searchZip;
      if (userTier === 'basic') { const loc = await userService.getUserLocation(userId, { isPrimary: true }); searchZip = loc.zip_code; }
      else if (userTier === 'premium') { if (!locationName) { res.status(400).json({ error: "locationName required for premium" }); return; } const loc = await userService.getUserLocation(userId, { locationName }); searchZip = loc.zip_code; }
      else if (userTier === 'expert') { if (!zipCode) { res.status(400).json({ error: "zipCode required for expert" }); return; } searchZip = zipCode; }
      else { if (!zipCode) { res.status(400).json({ error: "Zip code required" }); return; } searchZip = zipCode; }
      if (!searchZip) { logger.warn('Could not determine search zip code', { requestId, userId }); res.status(400).json({ error: "Could not determine search location." }); return; }
      const results = await providerService.findProviders({ zipCode: searchZip, drugName, radiusMiles, minClaims, taxonomyClass, sortBy, acceptedInsurance, minRating, cursor, limit, requestId });
      res.json(results);
    } catch (err) {
      const error = /** @type {Error} */ (err);
      if (error.message.includes('not found')) { logger.warn('Resource not found', { requestId, error: error.message }); res.status(404).json({ error: error.message }); return; }
      logger.error('find-providers error', { requestId, error: error.message, stack: error.stack }); res.status(500).json({ error: "Unexpected error during provider search" });
    }
};
// @ts-ignore - Ignore validation middleware type issue if @types/express-validation is missing
app.post('/api/find-providers', authenticateToken, validate(findProvidersSchema, {}, {}), findProvidersHandler);

/** @type {import('express').RequestHandler} */
const getProviderDetailsHandler = async (req, res) => {
    const customReq = /** @type {CustomRequest} */ (req); const requestId = customReq.id; const userId = customReq.user?.id; const providerId = req.params.id;
    if (!userId) { res.status(401).json({ error: "User not authenticated" }); return; } if (!providerId) { res.status(400).json({ error: 'Provider ID required.' }); return; }
    logger.info('Processing provider detail', { requestId, userId, providerId });
    try {
        const providerDetails = await providerService.getProviderDetails(providerId, requestId);
        if (!providerDetails) { res.status(404).json({ error: 'Provider not found.' }); return; }
        res.json(providerDetails);
    } catch (err) {
        const error = /** @type {Error} */ (err); logger.error('Provider detail error', { requestId, error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Internal server error' });
    }
};
app.get('/api/providers/:id', authenticateToken, getProviderDetailsHandler);

// --- Drug Suggestions Route ---
/** @type {import('express').RequestHandler} */
const getDrugSuggestionsHandler = async (req, res) => {
    const customReq = /** @type {CustomRequest} */ (req); const requestId = customReq.id; const userId = customReq.user?.id;
    const query = req.query.q;

    if (!userId) { res.status(401).json({ error: "User not authenticated" }); return; }
    if (typeof query !== 'string' || query.length < 2) { res.status(400).json({ error: 'Query parameter "q" must be at least 2 characters long.' }); return; }

    logger.info('Processing drug-suggestions', { requestId, userId, query });
    const client = await pool.connect();
    try {
        const searchQuery = `%${query}%`; // Add wildcards for ILIKE
        // Query for distinct drug names or generic names matching the query, limit results
        const dbQuery = `
        SELECT DISTINCT name FROM (
          SELECT drug_name as name FROM npi_prescriptions WHERE drug_name ILIKE $1
          UNION
          SELECT generic_name as name FROM npi_prescriptions WHERE generic_name ILIKE $1
          ) as suggestions
          LIMIT 10
         `;
        const { rows } = await client.query(dbQuery, [searchQuery]);
        const suggestions = rows.map(row => row.name); // Extract the names (aliased as 'name' in query)
        res.json(suggestions);
    } catch (err) {
        const error = /** @type {Error} */ (err);
        logger.error('Drug suggestions error', { requestId, error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Internal server error fetching drug suggestions' });
    } finally {
        client.release();
    }
};
// @ts-ignore - Ignore validation middleware type issue if @types/express-validation is missing
app.get('/api/drug-suggestions', authenticateToken, validate(drugSuggestionsSchema, {}, {}), getDrugSuggestionsHandler);


// --- Auth Sync & Membership Endpoints ---
/** @type {import('express').RequestHandler} */
const syncUserHandler = async (req, res) => {
    const customReq = /** @type {CustomRequest} */ (req); const requestId = customReq.id; const userId = customReq.user?.id; const userEmail = customReq.user?.email;
    if (!userId || !userEmail) { res.status(401).json({ success: false, message: 'User not authenticated.' }); return; }
    logger.info('Processing sync-user', { requestId, userId });
    try {
        const { data: existingProfile, error: fetchError } = await supabase.from('profiles').select('id, email, membership_tier').eq('id', userId).single();
        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
        if (existingProfile) {
            if (existingProfile.email !== userEmail) { logger.info('Updating email', { requestId, userId }); const { error: uError } = await supabase.from('profiles').update({ email: userEmail }).eq('id', userId); if (uError) throw uError; }
            res.json({ success: true, message: 'User synced.', data: { membershipTier: existingProfile.membership_tier } });
        } else {
            logger.info('Creating profile', { requestId, userId }); const defaultTier = 'basic';
            const { data: newProfile, error: iError } = await supabase.from('profiles').insert({ id: userId, email: userEmail, membership_tier: defaultTier }).select('membership_tier').single(); if (iError) throw iError;
            res.status(201).json({ success: true, message: 'Profile created.', data: { membershipTier: newProfile.membership_tier } });
        }
    } catch (err) {
        const error = /** @type {Error} */ (err); logger.error('Sync-user error', { requestId, error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
app.post('/api/sync-user', authenticateToken, syncUserHandler);

/** @type {import('express').RequestHandler} */
const getMembershipHandler = async (req, res) => {
    const customReq = /** @type {CustomRequest} */ (req); const requestId = customReq.id; const userId = customReq.user?.id;
    if (!userId) { res.status(401).json({ error: "User not authenticated" }); return; }
    logger.info('Processing user-membership', { requestId, userId });
    try {
        const tier = await userService.getUserTier(userId); logger.info('Membership fetched', { requestId, userId, tier });
        res.json({ membershipTier: tier });
    } catch (err) {
        const error = /** @type {Error} */ (err); logger.error('Membership fetch error', { requestId, error: error.message });
        if (error.message.toLowerCase().includes('not found')) res.status(404).json({ membershipTier: null, error: 'Profile not found.' });
        else res.status(500).json({ membershipTier: null, error: 'Internal server error' });
    }
};
app.post('/api/user-membership', authenticateToken, getMembershipHandler);

// --- Test Auth Route ---
/** @type {import('express').RequestHandler} */
const testAuthHandler = async (req, res) => {
    const customReq = /** @type {CustomRequest} */ (req);
    const requestId = customReq.id;
    const { token: tokenFromRequest } = req.body;

    if (!tokenFromRequest) {
        logger.warn('Test-auth: No token provided in request body', { requestId });
        res.status(400).json({ error: "Token required in request body" }); return;
    }

    logger.info('Processing test-auth with provided token', { requestId });
    try {
        const { data: { user }, error } = await supabase.auth.getUser(tokenFromRequest);

        if (error) {
            logger.warn('Test-auth: supabase.auth.getUser failed', { requestId, error: error.message, errorCode: error.code, errorStatus: error.status });
            res.status(error.status || 500).json({ error: "Token validation failed", details: error }); return;
        }
        if (!user) {
            logger.warn('Test-auth: supabase.auth.getUser returned no user (token likely invalid/expired)', { requestId });
            res.status(403).json({ error: "Invalid or expired token (no user found)" }); return;
        }

        logger.info('Test-auth: Token validated successfully', { requestId, userId: user.id, email: user.email });
        res.json({ success: true, user });
    } catch (err) {
        const error = /** @type {Error} */ (err);
        logger.error('Test-auth: Unexpected error', { requestId, error: error.message, stack: error.stack });
        res.status(500).json({ error: "Internal server error during test-auth" });
    }
};
app.post('/api/test-auth', express.json(), testAuthHandler); // Use express.json() for this route specifically if not globally applied before this
logger.info('Test auth route /api/test-auth defined.');


// --- User Location Management Endpoints ---
const USER_LOCATIONS_BASE = '/api/user/locations';

/** @type {import('express').RequestHandler} */
const getUserLocationsHandler = async (req, res) => {
    const customReq = /** @type {CustomRequest} */ (req); const requestId = customReq.id; const userId = customReq.user?.id;
    if (!userId) { res.status(401).json({ error: "User not authenticated" }); return; }
    logger.info('Fetching locations', { requestId, userId });
    const client = await pool.connect();
    try {
        const { rows } = await client.query('SELECT user_location_id as id, location_name as name, zip_code as "zipCode", is_primary as "isPrimary" FROM user_locations WHERE user_id = $1 ORDER BY is_primary DESC, location_name ASC', [userId]);
        res.json(rows);
    } catch (err) {
        const error = /** @type {Error} */ (err); logger.error('Fetch locations error', { requestId, error: error.message });
        res.status(500).json({ error: 'Internal server error' });
    } finally { client.release(); }
};
app.get(USER_LOCATIONS_BASE, authenticateToken, getUserLocationsHandler);

/** @type {import('express').RequestHandler} */
const addUserLocationHandler = async (req, res) => {
    const customReq = /** @type {CustomRequest} */ (req); const requestId = customReq.id; const userId = customReq.user?.id; const { name, zipCode } = req.body;
    if (!userId) { res.status(401).json({ error: "User not authenticated" }); return; }
    logger.info('Adding location', { requestId, userId, name });
    const client = await pool.connect();
    try {
        const zipCheck = await client.query('SELECT 1 FROM us_zipcodes WHERE zip_code = $1 LIMIT 1', [zipCode]);
        if (zipCheck.rowCount === 0) { res.status(400).json({ error: `Invalid zip code: ${zipCode}` }); return; }
        const { rowCount } = await client.query('SELECT 1 FROM user_locations WHERE user_id = $1 AND location_name = $2', [userId, name]);
        if (rowCount != null && rowCount > 0) { res.status(409).json({ error: `Location "${name}" already exists.` }); return; }
        const { rows } = await client.query('INSERT INTO user_locations (user_id, location_name, zip_code, is_primary) VALUES ($1, $2, $3, false) RETURNING user_location_id as id, location_name as name, zip_code as "zipCode", is_primary as "isPrimary"', [userId, name, zipCode]);
        res.status(201).json(rows[0]);
    } catch (err) {
        const error = /** @type {Error} */ (err); logger.error('Add location error', { requestId, error: error.message });
        res.status(500).json({ error: 'Internal server error' });
    } finally { client.release(); }
};
// @ts-ignore - Ignore validation middleware type issue if @types/express-validation is missing
app.post(USER_LOCATIONS_BASE, authenticateToken, requireTier(['premium', 'expert']), validate(addLocationSchema, {}, {}), addUserLocationHandler);

/** @type {import('express').RequestHandler} */
const deleteUserLocationHandler = async (req, res) => {
    const customReq = /** @type {CustomRequest} */ (req); const requestId = customReq.id; const userId = customReq.user?.id; const locationId = req.params.locationId;
    if (!userId) { res.status(401).json({ error: "User not authenticated" }); return; }
    logger.info('Deleting location', { requestId, userId, locationId });
    const client = await pool.connect();
    try {
         const { rows } = await client.query('SELECT is_primary FROM user_locations WHERE user_location_id = $1 AND user_id = $2', [locationId, userId]);
         if (rows.length > 0 && rows[0].is_primary) { res.status(400).json({ error: 'Cannot delete primary location.' }); return; }
        const { rowCount } = await client.query('DELETE FROM user_locations WHERE user_location_id = $1 AND user_id = $2', [locationId, userId]);
        if (rowCount === 0) { res.status(404).json({ error: 'Location not found.' }); return; }
        res.json({ success: true });
    } catch (err) {
        const error = /** @type {Error} */ (err); logger.error('Delete location error', { requestId, error: error.message });
        res.status(500).json({ error: 'Internal server error' });
    } finally { client.release(); }
};
app.delete(`${USER_LOCATIONS_BASE}/:locationId`, authenticateToken, deleteUserLocationHandler);

/** @type {import('express').RequestHandler} */
const setPrimaryLocationHandler = async (req, res) => {
    const customReq = /** @type {CustomRequest} */ (req); const requestId = customReq.id; const userId = customReq.user?.id; const locationId = req.params.locationId;
    if (!userId) { res.status(401).json({ error: "User not authenticated" }); return; }
    logger.info('Setting primary location', { requestId, userId, locationId });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('UPDATE user_locations SET is_primary = false WHERE user_id = $1 AND user_location_id != $2', [userId, locationId]);
        const { rowCount } = await client.query('UPDATE user_locations SET is_primary = true WHERE user_id = $1 AND user_location_id = $2', [userId, locationId]);
        if (rowCount === 0) { await client.query('ROLLBACK'); res.status(404).json({ error: 'Location not found.' }); return; }
        await client.query('COMMIT'); res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK'); const error = /** @type {Error} */ (err);
        logger.error('Set primary error', { requestId, error: error.message });
        res.status(500).json({ error: 'Internal server error' });
    } finally { client.release(); }
};
app.put(`${USER_LOCATIONS_BASE}/:locationId/set-primary`, authenticateToken, requireTier(['premium', 'expert']), setPrimaryLocationHandler);
logger.info('API routes defined.');

// --- Error Handling ---
/**
 * Express error handling middleware.
 * @param {any} err - Error object
 * @param {CustomRequest} req - Use CustomRequest
 * @param {ExpressResponse} res
 * @param {NextFunction} next
 */
// @ts-ignore
app.use((err, req, res, next) => {
  const requestId = req.id || 'unknown';
  // @ts-ignore - Duck typing for express-validation error
  if (err instanceof ValidationError || (err.error?.isJoi === true && err.statusCode === 400)) {
    logger.warn('Validation error', { requestId, error: err.details || err.error?.details });
    // @ts-ignore
    res.status(400).json({ error: 'Validation Error', details: err.details || err.error?.details }); return;
  }
  const error = /** @type {Error & { status?: number }} */ (err);
  const status = error.status || 500; const message = error.message || 'Internal Server Error';
  logger.error('Unhandled error', { requestId, error: message, status, stack: error.stack });
  const responseError = isProduction ? { error: message } : { error: message, stack: error.stack };
  if (!res.headersSent) { res.status(status).json(responseError); }
  else { logger.error('Headers already sent for unhandled error', { requestId }); next(err); }
});
logger.info('Error handling middleware configured.');

// --- Graceful Shutdown ---
/** @param {string} signal */
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received - shutting down`);
  try {
      if (pool) { // Check if pool exists before ending
        await pool.end(); logger.info('DB pool ended');
      }
  }
  catch (err) { const error = /** @type {Error} */ (err); logger.error('Error closing DB pool', { error: error.message }); }
  process.exit(0);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason, promise) => {
  let errorDetails = {}; if (reason instanceof Error) errorDetails = { message: reason.message, stack: reason.stack }; else errorDetails = { reason: String(reason) };
  logger.error('Unhandled Rejection', errorDetails);
  // Consider exiting process on unhandled rejection after logging
  // process.exit(1);
});
logger.info('Graceful shutdown configured.');

// --- Start Server ---
// Check if running directly or required as a module
if (require.main === module) {
  logger.info(`Attempting to start server on port ${PORT}...`); // Add log before listen
  app.listen(PORT, () => { logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`); });
} else {
  logger.info('Server module loaded but not started directly.');
}

