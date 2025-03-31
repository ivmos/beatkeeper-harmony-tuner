
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Download, Upload, BarChart2 } from "lucide-react";
import { 
  getStoredStats, 
  getTodayDateString, 
  formatDuration, 
  exportStatsToUrl, 
  mergeStats,
  type DailyStats 
} from '@/utils/statsUtils';

const MetronomeStats: React.FC = () => {
  const [stats, setStats] = useState<Record<string, DailyStats>>({});
  const [importUrl, setImportUrl] = useState('');
  const [exportUrl, setExportUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Load stats from localStorage
    const loadedStats = getStoredStats();
    setStats(loadedStats);
  }, []);

  const refreshStats = () => {
    const loadedStats = getStoredStats();
    setStats(loadedStats);
  };

  const handleExport = () => {
    const encodedStats = exportStatsToUrl();
    setExportUrl(encodedStats);
    toast({
      title: "Stats Exported",
      description: "Your stats have been encoded and are ready to copy",
    });
  };

  const handleImport = () => {
    if (!importUrl.trim()) {
      toast({
        title: "Import Failed",
        description: "Please enter stats data to import",
        variant: "destructive",
      });
      return;
    }

    const success = mergeStats(importUrl);
    if (success) {
      toast({
        title: "Stats Imported",
        description: "Your stats have been successfully imported and merged",
      });
      refreshStats();
      setImportUrl('');
    } else {
      toast({
        title: "Import Failed",
        description: "The provided data is invalid",
        variant: "destructive",
      });
    }
  };

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(stats).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <BarChart2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Practice Statistics</DialogTitle>
        </DialogHeader>
        
        {sortedDates.length > 0 ? (
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Calendar className="h-4 w-4 mr-2 inline" /> Date</TableHead>
                  <TableHead><Clock className="h-4 w-4 mr-2 inline" /> Practice Time</TableHead>
                  <TableHead>Sessions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDates.map(date => (
                  <TableRow key={date} className={date === getTodayDateString() ? "bg-muted/30" : ""}>
                    <TableCell>{date}</TableCell>
                    <TableCell>{formatDuration(stats[date].totalDuration)}</TableCell>
                    <TableCell>{stats[date].sessions.length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No practice sessions recorded yet. Start the metronome to begin tracking.
          </div>
        )}
        
        <div className="grid gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Export Stats</h3>
            <div className="flex gap-2">
              <Input 
                value={exportUrl} 
                readOnly
                placeholder="Click Export to generate code" 
                className="font-mono text-xs"
              />
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Import Stats</h3>
            <div className="flex gap-2">
              <Input 
                value={importUrl} 
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="Paste exported stats code here" 
                className="font-mono text-xs"
              />
              <Button variant="outline" size="sm" onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-start">
          <p className="text-xs text-muted-foreground">
            Your practice data is stored locally in your browser. Export and save your stats to keep a backup.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MetronomeStats;
