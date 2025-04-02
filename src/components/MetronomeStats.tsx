
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChartContainer } from "@/components/ui/chart";
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
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
  const sortedDates = Object.keys(stats).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // Prepare data for chart - convert to array of objects
  const chartData = sortedDates.map(date => ({
    date,
    minutes: Math.round(stats[date].totalDuration / (1000 * 60)), // Convert ms to minutes
  }));

  // Get the last 7 days of data for the chart
  const recentChartData = [...chartData].slice(-14);

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
          <DialogDescription>
            Track your practice sessions and progress over time
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="graph" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="graph">Graph</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>
          
          <TabsContent value="graph" className="pt-4">
            {recentChartData.length > 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="h-[300px] w-full">
                    <ChartContainer
                      config={{
                        practiceDuration: {
                          label: "Practice Duration",
                          color: "#9b59b6", // Metro purple color
                        },
                      }}
                    >
                      <BarChart data={recentChartData}>
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }} 
                          tickFormatter={(value) => value.slice(5)} // Show only MM-DD
                        />
                        <YAxis 
                          label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${value} min`, 'Practice Time']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Bar 
                          dataKey="minutes" 
                          name="Practice Duration" 
                          fill="var(--color-practiceDuration, #9b59b6)" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No practice sessions recorded yet. Start the metronome to begin tracking.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="table" className="pt-4">
            {sortedDates.length > 0 ? (
              <div className="rounded-md border">
                <ScrollArea className="h-[300px]">
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
                </ScrollArea>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No practice sessions recorded yet. Start the metronome to begin tracking.
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="grid gap-4 mt-4">
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
