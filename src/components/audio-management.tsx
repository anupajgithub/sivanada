import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Volume2, Plus, Edit, Play, Pause, ArrowLeft, Save, Upload, FileText, Clock, Trash2, Music, Bot } from 'lucide-react';
import { audioService, uploadService } from '../services';
import { toast } from 'sonner@2.0.3';

// Mock audio data
const mockBhajanAudio = [
  {
    id: 1,
    title: "Hanuman Chalisa",
    description: "Sacred devotional hymn dedicated to Lord Hanuman",
    category: "bhajan",
    status: "Published",
    audioFile: "hanuman_chalisa.mp3",
    duration: "8:45",
    text: "श्रीगुरु चरन सरोज रज, निज मनु मुकुरु सुधारि। बरनउं रघुबर बिमल जसु, जो दायकु फल चारि।।",
    views: 15420,
    likes: 890,
    createdAt: "2024-01-15"
  },
  {
    id: 2,
    title: "Om Namah Shivaya",
    description: "Powerful mantra for Lord Shiva meditation",
    category: "bhajan",
    status: "Published",
    audioFile: "om_namah_shivaya.mp3",
    duration: "12:30",
    text: "ॐ नमः शिवाय। ॐ नमः शिवाय। ॐ नमः शिवाय।",
    views: 8750,
    likes: 567,
    createdAt: "2024-01-20"
  },
  {
    id: 3,
    title: "Gayatri Mantra",
    description: "Universal prayer for wisdom and enlightenment",
    category: "bhajan",
    status: "Draft",
    audioFile: null,
    duration: null,
    text: "ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यम् भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्।",
    views: 0,
    likes: 0,
    createdAt: "2024-01-25"
  }
];

const mockTalksAudio = [
  {
    id: 10,
    title: "Life Lessons from Bhagavad Gita",
    description: "Spiritual discourse on ancient wisdom",
    category: "talks",
    status: "Published",
    audioFile: "gita_lessons.mp3",
    duration: "25:30",
    text: "In the Bhagavad Gita, Lord Krishna teaches us about dharma, karma, and the path to liberation...",
    views: 7320,
    likes: 425,
    createdAt: "2024-02-10"
  },
  {
    id: 11,
    title: "Meditation and Mindfulness",
    description: "Guided talk on meditation practices",
    category: "talks",
    status: "Published",
    audioFile: "meditation_talk.mp3",
    duration: "18:45",
    text: "Let us explore the transformative power of meditation and how it can bring peace to our daily lives...",
    views: 5240,
    likes: 312,
    createdAt: "2024-02-15"
  }
];



export function AudioManagement() {
  const [activeTab, setActiveTab] = useState("bhajan");
  const [isAddAudioOpen, setIsAddAudioOpen] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');
  const [audioList, setAudioList] = useState<any[]>([]);

  useEffect(() => {
    const unsub = audioService.subscribeToAudioContent({}, (list) => {
      setAudioList(list.map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        category: a.category === 'bhajan' ? 'bhajan' : 'talks',
        status: a.status === 'published' ? 'Published' : a.status === 'draft' ? 'Draft' : 'Archived',
        audioFile: a.audioUrl || null,
        duration: a.duration ? `${a.duration}` : null,
        text: a.textContent || ''
      })));
    });
    return unsub;
  }, []);

  const currentAudio = audioList.filter(audio => audio.category === activeTab);

  const getStatusBadge = (status: string) => {
    if (status === "Published") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">{status}</Badge>;
    } else {
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    return Music;
  };

  const handleDeleteAudio = async (audio: any) => {
    if (!audio?.id) return;
    const confirmDelete = window.confirm(`Delete audio "${audio.title}"?`);
    if (!confirmDelete) return;

    try {
      const res = await audioService.deleteAudio(audio.id);
      if (res.success) {
        toast.success('Audio deleted successfully');
        setAudioList((prev) => prev.filter(item => item.id !== audio.id));
        if (selectedAudio?.id === audio.id) {
          setSelectedAudio(null);
          setViewMode('list');
        }
      } else {
        toast.error(res.error || 'Failed to delete audio');
      }
    } catch (error) {
      toast.error((error as Error).message || 'Failed to delete audio');
    }
  };

  const handleEditAudio = (audio: any) => {
    setSelectedAudio(audio);
    setViewMode('edit');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedAudio(null);
  };

  // Audio Editor Component
  function AudioEditor({ audio, onSave, onDelete }: { audio: any; onSave: (audio: any) => void; onDelete: (audioId: string) => void }) {
    const [title, setTitle] = useState(audio.title);
    const [description, setDescription] = useState(audio.description);
    const [text, setText] = useState(audio.text);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

  const handleSave = async () => {
    try {
      const result = await audioService.updateAudio(audio.id, {
        title,
        description,
        textContent: text
      });

      if (result.success) {
        if (audioFile) {
          const uploadResult = await uploadService.uploadAudio(audioFile, `audio/${audio.id}`);
          if (uploadResult.success && uploadResult.url) {
            await audioService.updateAudio(audio.id, { audioUrl: uploadResult.url });
          }
        }
        
        const updatedAudio = {
          ...audio,
          title,
          description,
          text,
          audioFile: audioFile ? audioFile.name : audio.audioFile
        };
        onSave(updatedAudio);
        alert('Audio updated successfully');
      } else {
        alert('Failed to update audio: ' + result.error);
      }
    } catch (error) {
      alert('Error updating audio: ' + (error as Error).message);
    }
  };

    const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setAudioFile(file);
      }
    };

    const togglePlayback = () => {
      if (audio.audioUrl) {
        if (isPlaying) {
          // Pause logic would go here
          setIsPlaying(false);
        } else {
          // Play logic would go here
          setIsPlaying(true);
        }
      }
    };

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackToList}
              className="rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Audio List
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Audio Content</h1>
              <p className="text-gray-600 text-lg">Manage audio file and associated text</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onDelete(audio.id)}
              variant="destructive"
              className="gap-2 rounded-xl px-4"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button
              onClick={handleSave}
              className="gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl"
            >
              <Save className="h-5 w-5" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Audio & Details Section */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-50/50 to-orange-100/30 border-b border-orange-200/40 p-6">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                {React.createElement(getCategoryIcon(audio.category), { className: "h-6 w-6 text-orange-500" })}
                Audio Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="audio-title" className="text-sm font-semibold text-gray-700">Title</Label>
                <Input
                  id="audio-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
                  placeholder="Enter audio title"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="audio-description" className="text-sm font-semibold text-gray-700">Description</Label>
                <Textarea
                  id="audio-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20 min-h-[100px]"
                  placeholder="Enter audio description"
                />
              </div>

              {/* Audio Upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-gray-700">Audio File</Label>
                  <Button
                    onClick={() => audioInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    <Upload className="h-4 w-4" />
                    {audioFile || audio.audioFile ? 'Change Audio' : 'Upload Audio'}
                  </Button>
                </div>
                
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
                
                {(audioFile || audio.audioFile) && (
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                          <Volume2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {audioFile ? audioFile.name : audio.audioFile}
                          </p>
                          {audio.duration && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {audio.duration}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={togglePlayback}
                        variant="ghost"
                        size="sm"
                        className="w-10 h-10 rounded-full bg-white/60 hover:bg-white text-orange-600"
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Category Badge */}
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold text-gray-700">Category:</Label>
                <Badge className={`${audio.category === 'bhajan' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'} hover:bg-opacity-100`}>
                  {audio.category === 'bhajan' ? 'Bhajan' : 'AI Generated'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Text Content Section */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-50/50 to-orange-100/30 border-b border-orange-200/40 p-6">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="h-6 w-6 text-orange-500" />
                Text Content
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-gray-700">Associated Text/Lyrics</Label>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20 min-h-[400px] font-mono"
                  placeholder="Enter the text content, lyrics, or transcript..."
                />
                <div className="text-right">
                  <span className="text-sm text-gray-500">
                    {text.length} characters
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (viewMode === 'edit' && selectedAudio) {
    return (
      <AudioEditor
        audio={selectedAudio}
        onSave={(updatedAudio) => {
          setAudioList(audioList.map(audio => audio.id === updatedAudio.id ? updatedAudio : audio));
        }}
        onDelete={async (audioId) => {
          const target = audioList.find(item => item.id === audioId);
          if (target) {
            await handleDeleteAudio(target);
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Audio Management</h1>
          <p className="text-gray-600 text-lg">
            Manage Bhajan and Talks audio content with text
          </p>
        </div>
        <Dialog open={isAddAudioOpen} onOpenChange={setIsAddAudioOpen}>
          <DialogTrigger asChild>
            <Button className="gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl">
              <Plus className="h-5 w-5" />
              Add Audio Content
            </Button>
          </DialogTrigger>
          <DialogContent className="sm-max-w-[500px] rounded-2xl border-orange-200/40">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900">Add New Audio</DialogTitle>
              <p className="text-gray-600">Create new audio content with text</p>
            </DialogHeader>
            <AddAudioForm
              onSave={(newAudio) => {
                // handled via Firestore below
              }}
              onCancel={() => setIsAddAudioOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Tabs */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="bg-gradient-to-r from-orange-50/50 to-orange-100/30 border-b border-orange-200/40 p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Audio Library</CardTitle>
                <p className="text-gray-600 mt-1">Browse audio content by category</p>
              </div>
              <TabsList className="grid w-64 grid-cols-2 rounded-xl bg-orange-100/50 p-1">
                <TabsTrigger 
                  value="bhajan" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm font-semibold"
                >
                  <Music className="h-4 w-4 mr-2" />
                  Bhajan ({audioList.filter(a => a.category === 'bhajan').length})
                </TabsTrigger>
                <TabsTrigger 
                  value="talks"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm font-semibold"
                >
                  <Music className="h-4 w-4 mr-2" />
                  Talks ({audioList.filter(a => a.category === 'talks').length})
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <TabsContent value="bhajan" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {audioList.filter(audio => audio.category === 'bhajan').map((audio) => (
                  <AudioCard key={audio.id} audio={audio} onEdit={handleEditAudio} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="talks" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {audioList.filter(audio => audio.category === 'talks').map((audio) => (
                  <AudioCard key={audio.id} audio={audio} onEdit={handleEditAudio} />
                ))}
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );

  function AudioCard({ audio, onEdit }: { audio: any; onEdit: (audio: any) => void }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const IconComponent = getCategoryIcon(audio.category);

  const togglePlayback = () => {
    if (audio.audioUrl || audio.audioFile) {
      if (!audioElement) {
        const audioEl = new Audio(audio.audioUrl || audio.audioFile);
        audioEl.onended = () => setIsPlaying(false);
        audioEl.onloadedmetadata = () => {
          setDuration(audioEl.duration);
        };
        audioEl.ontimeupdate = () => {
          setCurrentTime(audioEl.currentTime);
        };
        audioEl.onerror = () => {
          console.error('Audio playback error');
          setIsPlaying(false);
        };
        setAudioElement(audioEl);
      }
      
      if (isPlaying) {
        audioElement?.pause();
        setIsPlaying(false);
      } else {
        audioElement?.play().catch(error => {
          console.error('Audio play error:', error);
          setIsPlaying(false);
        });
        setIsPlaying(true);
      }
    }
  };

    const formatTime = (time: number) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
      <Card className="group relative overflow-hidden border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-orange-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <CardContent className="relative p-6">
          {/* Header with Icon and Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300 ${
              audio.category === 'bhajan' 
                ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                : 'bg-gradient-to-br from-green-500 to-green-600'
            }`}>
              <IconComponent className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors duration-300">
                {audio.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">{audio.description}</p>
            </div>
          </div>
          
          {/* Status and Category */}
          <div className="flex items-center gap-2 mb-4">
            {getStatusBadge(audio.status)}
            <Badge className={`${
              audio.category === 'bhajan' ? 'bg-purple-100 text-purple-700 border-purple-200' :
              'bg-green-100 text-green-700 border-green-200'
            } hover:bg-opacity-100`}>
              {audio.category === 'bhajan' ? 'Bhajan' : 'Talks'}
            </Badge>
          </div>

          {/* Audio Preview */}
          {audio.audioFile && (
            <div className="p-4 bg-orange-50 rounded-xl mb-4 border border-orange-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-700">{audio.audioFile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {duration > 0 && (
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(duration)}
                      </span>
                    )}
                    <Button
                      onClick={togglePlayback}
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 rounded-full bg-white text-orange-600 hover:bg-orange-100 p-0"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                {/* Progress Bar */}
                {duration > 0 && (
                  <div className="space-y-1">
                    <div className="w-full bg-orange-200 rounded-full h-1.5">
                      <div 
                        className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Text Preview */}
          <div className="mb-4">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Text Content</span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-3">{audio.text}</p>
            </div>
          </div>

          {/* Stats */}
          {audio.status === "Published" && (
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="text-center p-2 bg-white/60 rounded-lg">
                <div className="font-semibold text-gray-900">{audio.views.toLocaleString()}</div>
                <div className="text-gray-600">Views</div>
              </div>
              <div className="text-center p-2 bg-white/60 rounded-lg">
                <div className="font-semibold text-gray-900">{audio.likes}</div>
                <div className="text-gray-600">Likes</div>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onEdit(audio)}
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
              Preview
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDeleteAudio(audio)}
              className="flex-1 rounded-lg"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        </CardContent>
        
        {/* Hover effect bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
      </Card>
    );
  }

  function AddAudioForm({ onSave, onCancel }: { onSave: (audio: any) => void; onCancel: () => void }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('bhajan');
    const [text, setText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = () => {
      if (!(title.trim() && description.trim() && category && text.trim())) return;
      audioService.createAudio({
        title: title.trim(),
        description: description.trim(),
        category: category === 'bhajan' ? 'bhajan' : 'ai',
        textContent: text.trim(),
        audioUrl: '',
        duration: 0,
        status: 'draft',
        featured: false,
        language: 'hindi',
        tags: []
      } as any).then(async (res) => {
        if (res.success && res.data) {
        if (file) {
          const uploaded = await uploadService.uploadAudio(file, `audio/${res.data.id}`);
          if (uploaded.success && uploaded.url) {
            await audioService.updateAudio(res.data.id, { audioUrl: uploaded.url });
          }
        }
          onSave(res.data);
          setTitle(''); setDescription(''); setCategory('bhajan'); setText(''); setFile(null);
          onCancel();
        } else {
          // eslint-disable-next-line no-alert
          alert(res.error || 'Failed to create audio');
        }
      });
    };

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="new-audio-title" className="text-sm font-semibold text-gray-700">Title</Label>
          <Input
            id="new-audio-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter audio title"
            className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="new-audio-description" className="text-sm font-semibold text-gray-700">Description</Label>
          <Textarea
            id="new-audio-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter audio description"
            className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-semibold text-gray-700">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-orange-200/40">
              <SelectItem value="bhajan">Bhajan</SelectItem>
              <SelectItem value="talks">Talks</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-audio-text" className="text-sm font-semibold text-gray-700">Text Content</Label>
          <Textarea
            id="new-audio-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter lyrics, transcript, or associated text..."
            className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20 min-h-[120px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-audio-file" className="text-sm font-semibold text-gray-700">Audio File (optional)</Label>
          <Input
            id="new-audio-file"
            type="file"
            accept="audio/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
          />
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="rounded-xl border-orange-200 text-gray-700 hover:bg-orange-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !description.trim() || !category || !text.trim()}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            Add Audio
          </Button>
        </div>
      </div>
    );
  }
}