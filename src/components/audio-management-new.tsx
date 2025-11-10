import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Volume2, Plus, Edit, Play, Pause, Clock, FileText } from 'lucide-react';

// Mock audio data
const mockHindiAudio = [
  {
    id: 1,
    title: "हिंदी कहानी संग्रह",
    description: "प्रसिद्ध हिंदी कहानियों का ऑडियो संग्रह",
    status: "Published",
    totalChapters: 8,
    publishedChapters: 6,
    totalDuration: "2h 45m"
  },
  {
    id: 2,
    title: "हिंदी कविता पाठ",
    description: "मशहूर कवियों की कविताओं का पाठ",
    status: "Draft",
    totalChapters: 5,
    publishedChapters: 2,
    totalDuration: "1h 20m"
  }
];

const mockEnglishAudio = [
  {
    id: 3,
    title: "English Poetry Collection",
    description: "Classic English poems narrated with emotion",
    status: "Published",
    totalChapters: 12,
    publishedChapters: 10,
    totalDuration: "3h 15m"
  },
  {
    id: 4,
    title: "Shakespeare's Sonnets",
    description: "Beautiful rendition of Shakespeare's famous sonnets",
    status: "Published",
    totalChapters: 20,
    publishedChapters: 15,
    totalDuration: "2h 30m"
  }
];

export function AudioManagement() {
  const [activeTab, setActiveTab] = useState("hindi");
  const [isAddSeriesOpen, setIsAddSeriesOpen] = useState(false);

  const currentAudio = activeTab === "hindi" ? mockHindiAudio : mockEnglishAudio;

  const getStatusBadge = (status: string) => {
    if (status === "Published") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">{status}</Badge>;
    } else {
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Audio Content</h1>
          <p className="text-gray-600 text-lg">
            Manage audio series and chapters across Hindi and English content
          </p>
        </div>
        <Dialog open={isAddSeriesOpen} onOpenChange={setIsAddSeriesOpen}>
          <DialogTrigger asChild>
            <Button className="gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl">
              <Plus className="h-5 w-5" />
              Add Audio Series
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl border-orange-200/40">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900">Create Audio Series</DialogTitle>
              <p className="text-gray-600">Start a new audio content series</p>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Series Title</Label>
                <Input 
                  id="title" 
                  placeholder="Enter series title" 
                  className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description</Label>
                <Input 
                  id="description" 
                  placeholder="Brief description of the series" 
                  className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language" className="text-sm font-semibold text-gray-700">Language</Label>
                <select className="w-full rounded-xl border border-orange-200/60 p-3 focus:border-orange-500 focus:ring-orange-500/20 focus:outline-none">
                  <option>Select language</option>
                  <option value="hindi">Hindi</option>
                  <option value="english">English</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddSeriesOpen(false)}
                  className="rounded-xl border-orange-200 text-gray-700 hover:bg-orange-50"
                >
                  Cancel
                </Button>
                <Button className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                  Create Series
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Language Tabs */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="bg-gradient-to-r from-orange-50/50 to-orange-100/30 border-b border-orange-200/40 p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Audio Library</CardTitle>
                <p className="text-gray-600 mt-1">Browse audio content by language</p>
              </div>
              <TabsList className="grid w-64 grid-cols-2 rounded-xl bg-orange-100/50 p-1">
                <TabsTrigger 
                  value="hindi" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm font-semibold"
                >
                  Hindi Audio ({mockHindiAudio.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="english"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm font-semibold"
                >
                  English Audio ({mockEnglishAudio.length})
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <TabsContent value="hindi" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {mockHindiAudio.map((series) => (
                  <AudioSeriesCard key={series.id} series={series} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="english" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {mockEnglishAudio.map((series) => (
                  <AudioSeriesCard key={series.id} series={series} />
                ))}
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );

  function AudioSeriesCard({ series }: { series: any }) {
    return (
      <Card className="group relative overflow-hidden border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-orange-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <CardContent className="relative p-6">
          {/* Audio Icon */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
              <Volume2 className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors duration-300">
                {series.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">{series.description}</p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="mb-4">
            {getStatusBadge(series.status)}
          </div>
          
          {/* Stats */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Chapters</span>
              <span className="font-semibold text-gray-900">{series.totalChapters}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Published</span>
              <span className="font-semibold text-green-600">{series.publishedChapters}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Duration</span>
              <span className="font-semibold text-gray-900 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {series.totalDuration}
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
              <span>Publishing Progress</span>
              <span>{Math.round((series.publishedChapters / series.totalChapters) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(series.publishedChapters / series.totalChapters) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 rounded-lg border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button 
              size="sm" 
              className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <Play className="h-3 w-3 mr-1" />
              Episodes
            </Button>
          </div>
        </CardContent>
        
        {/* Hover effect bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
      </Card>
    );
  }
}