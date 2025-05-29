
import React, { useState } from "react";
import { useEvents } from "../context/EventsContext";
import { ExtendedEventData } from "../types";
import PastEventsList from "./PastEventsList";
import PastEventsFilters from "./PastEventsFilters";
import GiftHistoryView from "./GiftHistoryView";
import AnalyticsDashboard from "./AnalyticsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PastEventsContainerProps {
  pastEvents: ExtendedEventData[];
}

const PastEventsContainer = ({ pastEvents }: PastEventsContainerProps) => {
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Filter past events based on criteria
  const filteredPastEvents = pastEvents.filter(event => {
    const eventYear = event.dateObj ? event.dateObj.getFullYear().toString() : "";
    const matchesYear = filterYear === "all" || eventYear === filterYear;
    const matchesType = filterType === "all" || event.type === filterType;
    const matchesSearch = searchTerm === "" || 
      event.person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesYear && matchesType && matchesSearch;
  });

  // Get unique years and types for filters
  const availableYears = Array.from(new Set(
    pastEvents.map(event => event.dateObj ? event.dateObj.getFullYear().toString() : "")
  )).filter(Boolean).sort().reverse();

  const availableTypes = Array.from(new Set(pastEvents.map(event => event.type)));

  if (pastEvents.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">No past events</h3>
            <p className="text-muted-foreground">
              Your gift history will appear here once you've sent gifts
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Past Events</TabsTrigger>
          <TabsTrigger value="history">Gift History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <PastEventsFilters
            filterYear={filterYear}
            setFilterYear={setFilterYear}
            filterType={filterType}
            setFilterType={setFilterType}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            availableYears={availableYears}
            availableTypes={availableTypes}
          />
          <PastEventsList events={filteredPastEvents} />
        </TabsContent>

        <TabsContent value="history">
          <GiftHistoryView events={filteredPastEvents} />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard events={pastEvents} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PastEventsContainer;
