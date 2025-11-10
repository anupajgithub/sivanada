import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Presentation, Edit, Plus, Trash2, Image, Globe, Eye, Search, Filter, Upload, Star } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { slideService, uploadService, middleSlideService } from '../services';

interface SlideContent {
  id: string;
  title: {
    hindi: string;
    english: string;
  };
  description: {
    hindi: string;
    english: string;
  };
  imageUrl: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  category: 'spiritual' | 'educational' | 'promotional' | 'announcement';
  priority: number;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
}

// Middle Slides (images-only) panel
function MiddleSlidesPanel() {
  type MS = { id: string; imageUrl: string; status: 'draft'|'published'|'archived'; featured: boolean; priority: number; linkUrl?: string; createdAt: string; updatedAt: string };
  const [items, setItems] = useState<MS[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<MS | null>(null);
  const [form, setForm] = useState<Partial<MS>>({ imageUrl: '', status: 'draft', featured: false, priority: 1, linkUrl: '' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      const res = await middleSlideService.getMiddleSlides({ sortBy: 'priority', sortOrder: 'asc', limit: 100 } as any);
      if (res.success) {
        setItems(res.data);
      } else {
        toast.error(res.error || 'Failed to load middle slides');
      }
      setLoading(false);
    })();
  }, []);

  const reset = () => setForm({ imageUrl: '', status: 'draft', featured: false, priority: 1, linkUrl: '' });

  const save = async () => {
    if (!form.imageUrl) {
      toast.error('Please upload/select an image');
      return;
    }
    // Block in demo mode — Firestore writes are not allowed by rules
    if (typeof window !== 'undefined' && localStorage.getItem('demoUser')) {
      toast.error('Demo mode cannot write to Firestore. Please log in with a Firebase admin account to save middle slides.');
      return;
    }
    if (editing) {
      const res = await middleSlideService.updateMiddleSlide(editing.id, {
        imageUrl: form.imageUrl!, status: form.status as any, featured: !!form.featured, priority: form.priority || 1, linkUrl: form.linkUrl || ''
      });
      if (res.success && res.data) {
        setItems(prev => prev.map(i => i.id === editing.id ? res.data as any : i));
        toast.success('Updated');
      } else toast.error(res.error || 'Failed');
    } else {
      const res = await middleSlideService.createMiddleSlide({
        imageUrl: form.imageUrl!, status: form.status as any, featured: !!form.featured, priority: form.priority || 1, linkUrl: form.linkUrl || '', createdAt: '' as any, updatedAt: '' as any
      } as any);
      if (res.success && res.data) {
        setItems(prev => [res.data as any, ...prev]);
        toast.success('Created');
      } else toast.error(res.error || 'Failed');
    }
    setIsOpen(false); setEditing(null); reset();
  };

  const pickImage = async (e: any) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    // reset input so choosing the same file again still triggers onChange
    try { if (e.target) e.target.value = ''; } catch {}

    // instant local preview
    try {
      const localUrl = URL.createObjectURL(file);
      setForm(f => ({ ...f, imageUrl: localUrl }));
    } catch {}

    setUploading(true);
    const res = await middleSlideService.uploadMiddleSlideImage(file);
    setUploading(false);
    if (res.success && res.data) {
      setForm(f => ({ ...f, imageUrl: res.data as string }));
      toast.success('Image uploaded');
    } else {
      toast.error(res.error || 'Upload failed');
    }
  };

  const del = async (id: string) => {
    if (!window.confirm('Delete this image?')) return;
    const res = await middleSlideService.deleteMiddleSlide(id);
    if (res.success) setItems(prev => prev.filter(i => i.id !== id)); else toast.error(res.error || 'Failed');
  };

  const toggle = async (id: string) => {
    const res = await middleSlideService.toggleFeatured(id);
    if (res.success && res.data) setItems(prev => prev.map(i => i.id === id ? res.data as any : i));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Middle Slides (Images Only)</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <Plus className="h-4 w-4 mr-2" /> Add Image
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Image' : 'Add Image'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Upload Image</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="border-orange-200 text-orange-600 hover:bg-orange-50">
                    <Upload className="h-4 w-4 mr-2" /> {uploading ? 'Uploading...' : 'Choose Image'}
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={pickImage} className="hidden" />
                </div>
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="preview" className="w-full h-40 object-cover rounded border" />
                ) : (
                  <div className="w-full h-40 bg-gray-50 border rounded flex items-center justify-center text-gray-400">No image</div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Status</Label>
                  <Select value={(form.status as any) || 'draft'} onValueChange={(v) => setForm(f => ({ ...f, status: v as any }))}>
                    <SelectTrigger className="bg-white border-orange-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Input type="number" min={1} max={50} value={form.priority || 1} onChange={(e) => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 1 }))} />
                </div>
              </div>
              <div>
                <Label>Link (optional)</Label>
                <Input value={form.linkUrl || ''} onChange={(e) => setForm(f => ({ ...f, linkUrl: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsOpen(false); setEditing(null); reset(); }} className="border-orange-200">Cancel</Button>
              <Button onClick={save} disabled={uploading || !form.imageUrl} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white disabled:opacity-50">{editing ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-500 border rounded p-8">No middle slides found. Click "Add Image" to create one.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(it => (
            <Card key={it.id} className="border overflow-hidden">
              <div className="relative w-full h-40 md:h-44 lg:h-48">
                <ImageWithFallback src={it.imageUrl} alt="slide" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute top-2 left-2">
                  <Badge className="text-xs bg-white/90 text-gray-700 border">{it.status}</Badge>
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button size="sm" variant="secondary" onClick={() => toggle(it.id)} className="h-8 w-8 p-0 bg-white/90">
                    <Star className={`h-4 w-4 ${it.featured ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { setEditing(it); setForm(it); setIsOpen(true); }} className="h-8 w-8 p-0 bg-white/90 text-orange-600">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => del(it.id)} className="h-8 w-8 p-0 bg-white/90 text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="flex items-center justify-between py-2">
                <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">Priority: {it.priority}</Badge>
                {it.featured && <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">Featured</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function SlideManagement() {
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [loading, setLoading] = useState(true);
  

  // Load slides from Firebase
  useEffect(() => {
    const loadSlides = async () => {
      try {
        const result = await slideService.getSlides();
        if (result.success && result.data) {
          setSlides(result.data);
        } else {
          console.error('Failed to load slides:', result.error);
        }
      } catch (error) {
        console.error('Error loading slides:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSlides();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [languageView, setLanguageView] = useState<'hindi' | 'english'>('english');
  const [editingSlide, setEditingSlide] = useState<SlideContent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const [newSlide, setNewSlide] = useState<Partial<SlideContent>>({
    title: { hindi: '', english: '' },
    description: { hindi: '', english: '' },
    imageUrl: '',
    status: 'draft',
    featured: false,
    category: 'spiritual',
    priority: 1
  });

  const filteredSlides = slides.filter(slide => {
    const matchesSearch = 
      slide.title.hindi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slide.title.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slide.description.hindi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slide.description.english.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || slide.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || slide.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const generateImageForSlide = async (title: string) => {
    setIsImageUploading(true);
    try {
      // For now, use a placeholder image service or default image
      // In a real implementation, you would integrate with an image generation API
      const imageUrl = `https://picsum.photos/800/600?random=${Date.now()}`;
      
      if (editingSlide) {
        setEditingSlide({ ...editingSlide, imageUrl });
      } else {
        setNewSlide({ ...newSlide, imageUrl });
      }
      
      toast.success('Image generated successfully!');
    } catch (error) {
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleCreateSlide = async () => {
    if (!newSlide.title?.hindi || !newSlide.title?.english || 
        !newSlide.description?.hindi || !newSlide.description?.english) {
      toast.error('Please fill in all required fields in both languages');
      return;
    }

    // Prevent writes in demo mode to avoid permission-denied
    if (typeof window !== 'undefined' && localStorage.getItem('demoUser')) {
      toast.error('Demo mode cannot write to Firestore. Please log in with a Firebase admin account to create slides.');
      return;
    }

    try {
      const result = await slideService.createSlide({
        title: newSlide.title!,
        description: newSlide.description!,
        imageUrl: newSlide.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center',
        status: newSlide.status as SlideContent['status'],
        featured: newSlide.featured!,
        category: newSlide.category as SlideContent['category'],
        priority: newSlide.priority!
      });
      
      if (result.success && result.data) {
        setSlides([...slides, result.data]);
        resetNewSlide();
        setIsDialogOpen(false);
        toast.success('Slide created successfully!');
      } else {
        toast.error('Failed to create slide: ' + result.error);
      }
    } catch (error) {
      toast.error('Error creating slide: ' + (error as Error).message);
    }
  };

  const handleEditSlide = async () => {
    if (!editingSlide || !editingSlide.title.hindi || !editingSlide.title.english || 
        !editingSlide.description.hindi || !editingSlide.description.english) {
      toast.error('Please fill in all required fields in both languages');
      return;
    }

    try {
      const result = await slideService.updateSlide(editingSlide.id, {
        title: editingSlide.title,
        description: editingSlide.description,
        imageUrl: editingSlide.imageUrl,
        status: editingSlide.status,
        featured: editingSlide.featured,
        category: editingSlide.category,
        priority: editingSlide.priority
      });
      
      if (result.success && result.data) {
        setSlides(slides.map(slide => 
          slide.id === editingSlide.id ? result.data! : slide
        ));
        setEditingSlide(null);
        setIsDialogOpen(false);
        toast.success('Slide updated successfully!');
      } else {
        toast.error('Failed to update slide: ' + result.error);
      }
    } catch (error) {
      toast.error('Error updating slide: ' + (error as Error).message);
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this slide?')) {
      try {
        const result = await slideService.deleteSlide(id);
        if (result.success) {
          setSlides(slides.filter(slide => slide.id !== id));
          toast.success('Slide deleted successfully!');
        } else {
          toast.error('Failed to delete slide: ' + result.error);
        }
      } catch (error) {
        toast.error('Error deleting slide: ' + (error as Error).message);
      }
    }
  };

  const toggleFeatured = async (id: string) => {
    try {
      const result = await slideService.toggleFeatured(id);
      if (result.success && result.data) {
        setSlides(slides.map(slide => 
          slide.id === id ? result.data! : slide
        ));
        toast.success('Slide updated successfully!');
      } else {
        toast.error('Failed to update slide: ' + result.error);
      }
    } catch (error) {
      toast.error('Error updating slide: ' + (error as Error).message);
    }
  };

  const resetNewSlide = () => {
    setNewSlide({
      title: { hindi: '', english: '' },
      description: { hindi: '', english: '' },
      imageUrl: '',
      status: 'draft',
      featured: false,
      category: 'spiritual',
      priority: 1
    });
  };

  const getStatusColor = (status: SlideContent['status']) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: SlideContent['category']) => {
    switch (category) {
      case 'spiritual': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'educational': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'promotional': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'announcement': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const [activeTab, setActiveTab] = useState<'top' | 'middle'>('top');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Slide Management</h1>
          <p className="text-orange-600 mt-2">Manage content slides with multilingual support</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-lg border border-orange-200 p-1 mr-3">
            <Button
              size="sm"
              variant={activeTab === 'top' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('top')}
              className={activeTab === 'top' ? 'bg-orange-500 text-white' : 'text-gray-600'}
            >
              Top Slides
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'middle' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('middle')}
              className={activeTab === 'middle' ? 'bg-orange-500 text-white' : 'text-gray-600'}
            >
              Middle Slides (Images)
            </Button>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg border border-orange-200 p-1">
            <Button
              size="sm"
              variant={languageView === 'english' ? 'default' : 'ghost'}
              onClick={() => setLanguageView('english')}
              className={languageView === 'english' ? 'bg-orange-500 text-white' : 'text-gray-600'}
            >
              English
            </Button>
            <Button
              size="sm"
              variant={languageView === 'hindi' ? 'default' : 'ghost'}
              onClick={() => setLanguageView('hindi')}
              className={languageView === 'hindi' ? 'bg-orange-500 text-white' : 'text-gray-600'}
            >
              हिंदी
            </Button>
          </div>
        </div>
      </div>

      {activeTab === 'top' ? (
      <>
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search and Filters */}
        <div className="flex flex-1 gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search slides..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-orange-200 focus:border-orange-500"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-white border-orange-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40 bg-white border-orange-200">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="spiritual">Spiritual</SelectItem>
              <SelectItem value="educational">Educational</SelectItem>
              <SelectItem value="promotional">Promotional</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add Slide Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Slide
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSlide ? 'Edit Slide' : 'Create New Slide'}</DialogTitle>
              <DialogDescription>
                {editingSlide ? 'Update slide content' : 'Add a new slide with multilingual content'}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="content" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                {/* English Content */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                    <h4 className="font-medium text-gray-900">English Content</h4>
                  </div>
                  
                  <div>
                    <Label htmlFor="title-en">Title (English) *</Label>
                    <Input
                      id="title-en"
                      value={editingSlide ? editingSlide.title.english : newSlide.title?.english || ''}
                      onChange={(e) => {
                        if (editingSlide) {
                          setEditingSlide({
                            ...editingSlide,
                            title: { ...editingSlide.title, english: e.target.value }
                          });
                        } else {
                          setNewSlide({
                            ...newSlide,
                            title: { ...newSlide.title!, english: e.target.value }
                          });
                        }
                      }}
                      placeholder="Enter English title"
                      className="bg-white border-orange-200"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description-en">Description (English) *</Label>
                    <Textarea
                      id="description-en"
                      value={editingSlide ? editingSlide.description.english : newSlide.description?.english || ''}
                      onChange={(e) => {
                        if (editingSlide) {
                          setEditingSlide({
                            ...editingSlide,
                            description: { ...editingSlide.description, english: e.target.value }
                          });
                        } else {
                          setNewSlide({
                            ...newSlide,
                            description: { ...newSlide.description!, english: e.target.value }
                          });
                        }
                      }}
                      placeholder="Enter English description"
                      className="bg-white border-orange-200 min-h-[80px]"
                    />
                  </div>
                </div>

                {/* Hindi Content */}
                <div className="space-y-3 pt-4 border-t border-orange-100">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-orange-500" />
                    <h4 className="font-medium text-gray-900">Hindi Content (हिंदी सामग्री)</h4>
                  </div>
                  
                  <div>
                    <Label htmlFor="title-hi">Title (Hindi) * / शीर्षक (हिंदी) *</Label>
                    <Input
                      id="title-hi"
                      value={editingSlide ? editingSlide.title.hindi : newSlide.title?.hindi || ''}
                      onChange={(e) => {
                        if (editingSlide) {
                          setEditingSlide({
                            ...editingSlide,
                            title: { ...editingSlide.title, hindi: e.target.value }
                          });
                        } else {
                          setNewSlide({
                            ...newSlide,
                            title: { ...newSlide.title!, hindi: e.target.value }
                          });
                        }
                      }}
                      placeholder="हिंदी शीर्षक दर्ज करें"
                      className="bg-white border-orange-200"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description-hi">Description (Hindi) * / विवरण (हिंदी) *</Label>
                    <Textarea
                      id="description-hi"
                      value={editingSlide ? editingSlide.description.hindi : newSlide.description?.hindi || ''}
                      onChange={(e) => {
                        if (editingSlide) {
                          setEditingSlide({
                            ...editingSlide,
                            description: { ...editingSlide.description, hindi: e.target.value }
                          });
                        } else {
                          setNewSlide({
                            ...newSlide,
                            description: { ...newSlide.description!, hindi: e.target.value }
                          });
                        }
                      }}
                      placeholder="हिंदी विवरण दर्ज करें"
                      className="bg-white border-orange-200 min-h-[80px]"
                    />
                  </div>
                </div>

                {/* Image Section */}
                <div className="space-y-3 pt-4 border-t border-orange-100">
                  <div className="flex items-center justify-between">
                    <Label>Slide Image</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const title = editingSlide 
                          ? editingSlide.title.english || editingSlide.title.hindi
                          : newSlide.title?.english || newSlide.title?.hindi || 'spiritual content';
                        generateImageForSlide(title);
                      }}
                      disabled={isImageUploading}
                      className="border-orange-200 text-orange-600 hover:bg-orange-50"
                    >
                      {isImageUploading ? (
                        <>Generating...</>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Generate Image
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {(editingSlide?.imageUrl || newSlide.imageUrl) && (
                    <div className="relative">
                      <ImageWithFallback
                        src={editingSlide?.imageUrl || newSlide.imageUrl!}
                        alt="Slide preview"
                        className="w-full h-48 object-cover rounded-lg border border-orange-200"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={editingSlide ? editingSlide.category : newSlide.category}
                      onValueChange={(value) => {
                        if (editingSlide) {
                          setEditingSlide({ ...editingSlide, category: value as SlideContent['category'] });
                        } else {
                          setNewSlide({ ...newSlide, category: value as SlideContent['category'] });
                        }
                      }}
                    >
                      <SelectTrigger className="bg-white border-orange-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spiritual">Spiritual</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="promotional">Promotional</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={editingSlide ? editingSlide.status : newSlide.status}
                      onValueChange={(value) => {
                        if (editingSlide) {
                          setEditingSlide({ ...editingSlide, status: value as SlideContent['status'] });
                        } else {
                          setNewSlide({ ...newSlide, status: value as SlideContent['status'] });
                        }
                      }}
                    >
                      <SelectTrigger className="bg-white border-orange-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="priority">Priority (1-10)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="10"
                    value={editingSlide ? editingSlide.priority : newSlide.priority}
                    onChange={(e) => {
                      const priority = parseInt(e.target.value) || 1;
                      if (editingSlide) {
                        setEditingSlide({ ...editingSlide, priority });
                      } else {
                        setNewSlide({ ...newSlide, priority });
                      }
                    }}
                    className="bg-white border-orange-200"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <Label htmlFor="featured" className="text-sm font-medium">Featured Slide</Label>
                    <p className="text-xs text-gray-600">Mark this slide as featured for priority display</p>
                  </div>
                  <Switch
                    id="featured"
                    checked={editingSlide ? editingSlide.featured : newSlide.featured}
                    onCheckedChange={(checked) => {
                      if (editingSlide) {
                        setEditingSlide({ ...editingSlide, featured: checked });
                      } else {
                        setNewSlide({ ...newSlide, featured: checked });
                      }
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingSlide(null);
                  resetNewSlide();
                }}
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                Cancel
              </Button>
              <Button
                onClick={editingSlide ? handleEditSlide : handleCreateSlide}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              >
                {editingSlide ? 'Update Slide' : 'Create Slide'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Slides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSlides.map((slide) => (
          <Card key={slide.id} className="hover:shadow-lg transition-all duration-200 border-orange-200/40 bg-white">
            <div className="relative">
              <ImageWithFallback
                src={slide.imageUrl}
                alt={slide.title[languageView]}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge className={`text-xs ${getStatusColor(slide.status)}`}>
                  {slide.status}
                </Badge>
                {slide.featured && (
                  <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              <div className="absolute top-3 right-3 flex gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toggleFeatured(slide.id)}
                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                >
                  <Star className={`h-4 w-4 ${slide.featured ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditingSlide(slide);
                    setIsDialogOpen(true);
                  }}
                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-orange-600"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDeleteSlide(slide.id)}
                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-gray-900 line-clamp-2">
                {slide.title[languageView]}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${getCategoryColor(slide.category)}`}>
                  {slide.category}
                </Badge>
                <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                  Priority: {slide.priority}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 line-clamp-3">
                {slide.description[languageView]}
              </p>
              
              <div className="flex items-center justify-between pt-2 border-t border-orange-100">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Eye className="h-4 w-4" />
                  <span>{slide.viewCount} views</span>
                </div>
                <span className="text-xs text-gray-500">
                  Updated: {new Date(slide.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSlides.length === 0 && (
        <div className="text-center py-12">
          <Presentation className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No slides found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Create your first slide to get started'}
          </p>
        </div>
      )}
      </>
      ) : (
        <MiddleSlidesPanel />
      )}
    </div>
  );
}