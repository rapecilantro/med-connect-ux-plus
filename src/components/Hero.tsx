
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Hero = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/find-providers?drug=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-medblue-100 to-white">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 max-w-xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-medblue-800 leading-tight animate-fade-in">
            Find Prescribers for Your Medications
          </h1>
          <p className="text-lg text-gray-700 animate-fade-in" style={{animationDelay: "0.2s"}}>
            Connect with healthcare providers who specialize in prescribing the exact medications you need. 
            Simplified appointments, expert care.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-fade-in" style={{animationDelay: "0.3s"}}>
            <Button asChild size="lg" className="bg-medblue-600 hover:bg-medblue-700 text-lg font-medium">
              <Link to="/find-providers">Find Medication Prescribers</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg font-medium">
              <Link to="/find-providers">Advanced Provider Search</Link>
            </Button>
          </div>
          
          <form onSubmit={handleSearchSubmit} className="relative mt-8 max-w-md animate-fade-in" style={{animationDelay: "0.4s"}}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input 
              type="text"
              placeholder="Search medications..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-medblue-500 focus:border-medblue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button 
              type="submit" 
              className="absolute right-1 top-1 bottom-1 px-3 bg-medblue-600 hover:bg-medblue-700"
              disabled={!searchQuery.trim()}
            >
              Search
            </Button>
          </form>
        </div>
        
        <div className="hidden md:block">
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-medteal-100 rounded-full z-0"></div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-medblue-100 rounded-full z-0"></div>
            <div className="relative z-10 bg-white rounded-xl shadow-xl p-4 transform rotate-1 animate-fade-in" style={{animationDelay: "0.5s"}}>
              <div className="bg-medblue-50 p-6 rounded-lg">
                <h3 className="font-bold text-xl mb-2 text-medblue-800">Medication-Specific Providers</h3>
                <p className="text-gray-600 mb-4">Find prescribers who specialize in your exact medication needs</p>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-medblue-200 rounded-full"></div>
                  <div>
                    <p className="font-medium text-medblue-800">Dr. Sarah Chen</p>
                    <p className="text-sm text-gray-600">Psychiatrist - Sertraline Specialist</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-medteal-600 bg-medteal-50 px-2 py-1 rounded">4.9 ★</span>
                    <span className="text-sm text-gray-500 ml-2">98% match</span>
                  </div>
                  <button className="text-sm font-medium text-medblue-600 hover:text-medblue-700">View Profile</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
