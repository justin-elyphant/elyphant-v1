
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload, FileText, Calendar } from "lucide-react";
import { useEvents } from "../context/EventsContext";
import { ExtendedEventData } from "../types";
import { toast } from "sonner";

interface ExportImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExportImportDialog = ({ open, onOpenChange }: ExportImportDialogProps) => {
  const { events } = useEvents();
  const [importFile, setImportFile] = useState<File | null>(null);

  const exportToJSON = () => {
    const exportData = events.map(event => ({
      person: event.person,
      type: event.type,
      date: event.date,
      privacyLevel: event.privacyLevel,
      autoGiftEnabled: event.autoGiftEnabled,
      autoGiftAmount: event.autoGiftAmount,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Events exported successfully!");
  };

  const exportToCSV = () => {
    const headers = ['Person', 'Event Type', 'Date', 'Privacy Level', 'Auto Gift', 'Gift Amount'];
    const csvData = [
      headers.join(','),
      ...events.map(event => [
        `"${event.person}"`,
        `"${event.type}"`,
        `"${event.date}"`,
        `"${event.privacyLevel}"`,
        event.autoGiftEnabled ? 'Yes' : 'No',
        event.autoGiftAmount || 0,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Events exported to CSV successfully!");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const importEvents = async () => {
    if (!importFile) return;

    try {
      const text = await importFile.text();
      const importedData = JSON.parse(text);
      
      // Validate the data structure
      if (!Array.isArray(importedData)) {
        throw new Error('Invalid file format');
      }

      // Here you would normally call an API to import the events
      console.log('Importing events:', importedData);
      toast.success(`Successfully imported ${importedData.length} events!`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to import events. Please check the file format.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export / Import Events</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Export your events to backup or share with others.
            </div>
            
            <div className="space-y-3">
              <Button onClick={exportToJSON} className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Export as JSON
              </Button>
              
              <Button onClick={exportToCSV} variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Export as CSV
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {events.length} events available for export
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Import events from a previously exported JSON file.
            </div>
            
            <div className="space-y-3">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm">
                  <label htmlFor="file-upload" className="cursor-pointer text-primary hover:text-primary/80">
                    Choose a file
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="text-muted-foreground"> or drag and drop</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  JSON files only
                </div>
              </div>
              
              {importFile && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm">{importFile.name}</span>
                  <Button onClick={importEvents} size="sm">
                    Import
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ExportImportDialog;
