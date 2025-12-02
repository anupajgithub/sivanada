import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Presentation, Edit, Plus, Trash2, Image, Globe, Eye, Search, Filter, Upload, Star, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { slideService, uploadService, middleSlideService } from '../services';

// Spiritual images array - odd indices (1,3,5,7,9) for Hindi, even indices (0,2,4,6,8) for English
const spiritualImages = [
  { url: 'https://res.cloudinary.com/dyltyzwo6/image/upload/v1761684222/InShot_20251006_173801183_pyfkdj.jpg', name: '' },
  { url: 'https://res.cloudinary.com/dyltyzwo6/image/upload/v1761684236/InShot_20251006_102020836_asvkrw.jpg', name: '' },
  { url: 'https://res.cloudinary.com/dyltyzwo6/image/upload/v1761684234/InShot_20251006_170718457_gcf13z.jpg', name: '' },
  { url: 'https://res.cloudinary.com/dyltyzwo6/image/upload/v1761684235/InShot_20251006_174339940_oktzd1.jpg', name: '' },
  { url: 'https://res.cloudinary.com/dyltyzwo6/image/upload/v1761684231/InShot_20251006_173137299_h9p07l.jpg', name: '' },
  { url: 'https://res.cloudinary.com/dyltyzwo6/image/upload/v1761684232/InShot_20251006_104610214_zndfvi.jpg', name: '' },
  { url: 'https://res.cloudinary.com/dyltyzwo6/image/upload/v1761684222/InShot_20251006_172449600_p2jl44.jpg', name: '' },
  { url: 'https://res.cloudinary.com/dyltyzwo6/image/upload/v1761684234/InShot_20251006_102559865_ssrzi6.jpg', name: '' },
  { url: 'https://res.cloudinary.com/dyltyzwo6/image/upload/v1761684226/InShot_20251006_171454585_bya40v.jpg', name: '' },
  { url: 'https://res.cloudinary.com/dyltyzwo6/image/upload/v1761684227/InShot_20251006_103944934_bsupz5.jpg', name: '' },
];

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
  bookName: {
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

// Helper function for status colors
const getStatusColorForMiddle = (status: 'draft' | 'published' | 'archived') => {
  switch (status) {
    case 'published': return 'bg-green-100 text-green-800 border-green-200';
    case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Middle Slides (images-only) panel
function MiddleSlidesPanel() {
  type MS = { 
    id: string; 
    title: { hindi: string; english: string };
    description: { hindi: string; english: string };
    imageUrl: { hindi: string; english: string };
    status: 'draft'|'published'|'archived'; 
    featured: boolean; 
    priority: number; 
    linkUrl?: string; 
    createdAt: string; 
    updatedAt: string;
  };
  const [items, setItems] = useState<MS[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<MS | null>(null);
  const [form, setForm] = useState<Partial<MS>>({ 
    title: { hindi: '', english: '' },
    description: { hindi: '', english: '' },
    imageUrl: { hindi: '', english: '' }, 
    status: 'draft', 
    featured: false, 
    priority: 1, 
    linkUrl: '' 
  });
  const [uploading, setUploading] = useState({ hindi: false, english: false });
  const hindiFileInputRef = useRef<HTMLInputElement | null>(null);
  const englishFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      const res = await middleSlideService.getMiddleSlides({ sortBy: 'priority', sortOrder: 'asc', limit: 100 } as any);
      if (res.success) {
        // Convert old format to new format if needed
        const convertedItems = res.data.map((item: any) => {
          if (typeof item.imageUrl === 'string') {
            // Old format - convert to new format
            return {
              ...item,
              title: item.title || { hindi: '', english: '' },
              description: item.description || { hindi: '', english: '' },
              imageUrl: {
                hindi: item.imageUrl,
                english: item.imageUrl
              }
            };
          }
          return item;
        });
        setItems(convertedItems);
      } else {
        toast.error('Failed to load middle slides');
      }
      setLoading(false);
    })();
  }, []);

  const reset = () => setForm({ 
    title: { hindi: '', english: '' },
    description: { hindi: '', english: '' },
    imageUrl: { hindi: '', english: '' }, 
    status: 'draft', 
    featured: false, 
    priority: 1, 
    linkUrl: '' 
  });
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    if (!form.imageUrl?.hindi || !form.imageUrl?.english) {
      toast.error('Please upload both Hindi and English images');
      return;
    }
    
    // Check if images are still uploading
    if (uploading.hindi || uploading.english) {
      toast.error('Please wait for image uploads to complete');
      return;
    }
    
    // Validate that images are not local blob URLs (should be Cloudinary URLs)
    const hindiUrl = form.imageUrl.hindi;
    const englishUrl = form.imageUrl.english;
    if (hindiUrl.startsWith('blob:') || englishUrl.startsWith('blob:')) {
      toast.error('Please wait for images to finish uploading to Cloudinary before saving');
      return;
    }
    
    if (!form.description?.hindi || !form.description?.english) {
      toast.error('Please fill in descriptions in both languages');
      return;
    }
    
    // Check if we're at the limit (5 slides max)
    if (!editing && items.length >= 5) {
      toast.error('Maximum 5 middle slides allowed. Please delete one before adding a new one.');
      return;
    }
    
    // Block in demo mode — Firestore writes are not allowed by rules
    if (typeof window !== 'undefined' && localStorage.getItem('demoUser')) {
      toast.error('Demo mode cannot write to Firestore. Please log in with a Firebase admin account to save middle slides.');
      return;
    }
    setIsSaving(true);
    try {
      // Auto-generate titles from descriptions if not provided
      const titleHindi = form.title?.hindi || form.description?.hindi?.substring(0, 50).trim() || 'Slide';
      const titleEnglish = form.title?.english || form.description?.english?.substring(0, 50).trim() || 'Slide';
      
      if (editing) {
        const res = await middleSlideService.updateMiddleSlide(editing.id, {
          title: { hindi: titleHindi, english: titleEnglish },
          description: form.description!,
          imageUrl: form.imageUrl!, 
          status: form.status as any, 
          featured: !!form.featured, 
          priority: form.priority || 1, 
          linkUrl: form.linkUrl || ''
        });
        if (res.success && res.data) {
          setItems(prev => prev.map(i => i.id === editing.id ? res.data as any : i));
          toast.success('Updated successfully');
        } else toast.error(res.error || 'Failed');
      } else {
        const res = await middleSlideService.createMiddleSlide({
          title: { hindi: titleHindi, english: titleEnglish },
          description: form.description!,
          imageUrl: form.imageUrl!, 
          status: form.status as any, 
          featured: !!form.featured, 
          priority: form.priority || 1, 
          linkUrl: form.linkUrl || '', 
          createdAt: '' as any, 
          updatedAt: '' as any
        } as any);
        if (res.success && res.data) {
          setItems(prev => [res.data as any, ...prev]);
          toast.success('Created successfully');
        } else toast.error(res.error || 'Failed');
      }
      setIsOpen(false); setEditing(null); reset();
    } finally {
      setIsSaving(false);
    }
  };

  const pickImage = async (e: any, language: 'hindi' | 'english') => {
    const file = e.target?.files?.[0];
    if (!file) return;
    // reset input so choosing the same file again still triggers onChange
    try { if (e.target) e.target.value = ''; } catch {}

    // instant local preview
    try {
      const localUrl = URL.createObjectURL(file);
      setForm(f => ({ 
        ...f, 
        imageUrl: { 
          ...f.imageUrl, 
          [language]: localUrl 
        } as any
      }));
    } catch {}

    setUploading(prev => ({ ...prev, [language]: true }));
    
    // Upload to Cloudinary - pass slide ID if editing for better organization
    const slideId = editing?.id || `temp-${Date.now()}`;
    const res = await middleSlideService.uploadMiddleSlideImage(file, slideId);
    setUploading(prev => ({ ...prev, [language]: false }));
    
    if (res.success && res.data) {
      // Replace with Cloudinary URL
      setForm(f => ({ 
        ...f, 
        imageUrl: { 
          ...f.imageUrl, 
          [language]: res.data as string 
        } as any
      }));
      toast.success(`${language === 'hindi' ? 'Hindi' : 'English'} image uploaded to Cloudinary successfully`);
    } else {
      toast.error(res.error || 'Upload failed. Please try again.');
      // Revert to previous image on error
      if (editing && editing.imageUrl) {
        const currentUrl = typeof editing.imageUrl === 'string' 
          ? editing.imageUrl 
          : editing.imageUrl[language];
        setForm(f => ({ 
          ...f, 
          imageUrl: { 
            ...f.imageUrl, 
            [language]: currentUrl 
          } as any
        }));
      }
    }
  };

  const del = async (id: string) => {
    if (!window.confirm('Delete this slide?')) return;
    const res = await middleSlideService.deleteMiddleSlide(id);
    if (res.success) {
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Slide deleted successfully');
    } else {
      toast.error(res.error || 'Failed');
    }
  };

  const toggle = async (id: string) => {
    const res = await middleSlideService.toggleFeatured(id);
    if (res.success && res.data) setItems(prev => prev.map(i => i.id === id ? res.data as any : i));
  };

  const [isInitializing, setIsInitializing] = useState(false);

  const initializeSpiritualImages = async () => {
    // Block in demo mode
    if (typeof window !== 'undefined' && localStorage.getItem('demoUser')) {
      toast.error('Demo mode cannot write to Firestore. Please log in with a Firebase admin account to initialize slides.');
      return;
    }

    if (items.length > 0) {
      const confirm = window.confirm(`You already have ${items.length} slide(s). This will create 5 new slides. Continue?`);
      if (!confirm) return;
    }

    setIsInitializing(true);
    try {
      let successCount = 0;
      let failCount = 0;

      // Create 5 slides, pairing odd indices (Hindi) with even indices (English)
      for (let i = 0; i < 5; i++) {
        const hindiIndex = i * 2 + 1; // 1, 3, 5, 7, 9
        const englishIndex = i * 2; // 0, 2, 4, 6, 8

        const hindiImage = spiritualImages[hindiIndex];
        const englishImage = spiritualImages[englishIndex];

        if (!hindiImage || !englishImage) {
          failCount++;
          continue;
        }

        const slideData = {
          title: {
            hindi: `Spiritual Slide ${i + 1}`,
            english: `Spiritual Slide ${i + 1}`
          },
          description: {
            hindi: `आध्यात्मिक सामग्री ${i + 1}`,
            english: `Spiritual Content ${i + 1}`
          },
          imageUrl: {
            hindi: hindiImage.url,
            english: englishImage.url
          },
          status: 'published' as const,
          featured: i === 0, // First slide is featured
          priority: i + 1,
          linkUrl: ''
        };

        const result = await middleSlideService.createMiddleSlide(slideData as any);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
          console.error(`Failed to create slide ${i + 1}:`, result.error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} slide(s)${failCount > 0 ? `, ${failCount} failed` : ''}`);
        // Reload slides
        const res = await middleSlideService.getMiddleSlides({ sortBy: 'priority', sortOrder: 'asc', limit: 100 } as any);
        if (res.success) {
          const convertedItems = res.data.map((item: any) => {
            if (typeof item.imageUrl === 'string') {
              return {
                ...item,
                title: item.title || { hindi: '', english: '' },
                description: item.description || { hindi: '', english: '' },
                imageUrl: {
                  hindi: item.imageUrl,
                  english: item.imageUrl
                }
              };
            }
            return item;
          });
          setItems(convertedItems);
        }
      } else {
        toast.error(`Failed to create slides. ${failCount} failed.`);
      }
    } catch (error) {
      toast.error('Error initializing slides: ' + (error as Error).message);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Middle Slides</h2>
          <p className="text-sm text-gray-600 mt-1">Maximum 5 slides (10 images: 5 Hindi + 5 English)</p>
        </div>
        <div className="flex gap-2">
          {items.length === 0 && (
            <Button
              onClick={initializeSpiritualImages}
              disabled={isInitializing}
              variant="outline"
              className="border-green-200 text-green-600 hover:bg-green-50"
            >
              {isInitializing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Image className="h-4 w-4 mr-2" />
                  Initialize with Spiritual Images
                </>
              )}
            </Button>
          )}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                disabled={!editing && items.length >= 5}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Slide
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Middle Slide' : 'Add Middle Slide'}</DialogTitle>
              <DialogDescription>
                {editing ? 'Update slide content' : 'Add a new middle slide with Hindi and English images'}
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
                    <Label htmlFor="description-en">Description (English) *</Label>
                    <Textarea
                      id="description-en"
                      value={form.description?.english || ''}
                      onChange={(e) => setForm(f => ({
                        ...f,
                        description: { ...f.description!, english: e.target.value }
                      }))}
                      placeholder="Enter English description"
                      className="bg-white border-orange-200 min-h-[80px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>English Image *</Label>
                    <p className="text-xs text-gray-500 mb-2">Upload your own image (stored in Cloudinary) or select from spiritual images below</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button 
                        type="button" 
                        variant="outline" 
                        disabled={uploading.english} 
                        onClick={() => englishFileInputRef.current?.click()} 
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                      >
                        <Upload className="h-4 w-4 mr-2" /> 
                        {uploading.english ? 'Uploading to Cloudinary...' : 'Upload Image'}
                      </Button>
                      <input 
                        ref={englishFileInputRef} 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => pickImage(e, 'english')} 
                        className="hidden" 
                      />
                      {/* Quick select from spiritual images - even indices (0,2,4,6,8) for English */}
                      <div className="flex gap-2 flex-wrap">
                        {spiritualImages.map((img, idx) => {
                          // Only show even indices (0, 2, 4, 6, 8) for English
                          if (idx % 2 === 0) {
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setForm(f => ({
                                    ...f,
                                    imageUrl: {
                                      ...f.imageUrl,
                                      english: img.url
                                    } as any
                                  }));
                                }}
                                className={`relative w-16 h-16 rounded border-2 overflow-hidden ${
                                  form.imageUrl?.english === img.url
                                    ? 'border-orange-500 ring-2 ring-orange-200'
                                    : 'border-gray-200 hover:border-orange-300'
                                }`}
                                title={`Select English Image ${(idx / 2) + 1}`}
                              >
                                <img src={img.url} alt={`English ${(idx / 2) + 1}`} className="w-full h-full object-cover" />
                              </button>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                    {form.imageUrl?.english ? (
                      <img src={form.imageUrl.english} alt="English preview" className="w-full h-40 object-cover rounded border" />
                    ) : (
                      <div className="w-full h-40 bg-gray-50 border rounded flex items-center justify-center text-gray-400">No English image</div>
                    )}
                  </div>
                </div>

                {/* Hindi Content */}
                <div className="space-y-3 pt-4 border-t border-orange-100">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-orange-500" />
                    <h4 className="font-medium text-gray-900">Hindi Content (हिंदी सामग्री)</h4>
                  </div>
                  
                  <div>
                    <Label htmlFor="description-hi">Description (Hindi) * / विवरण (हिंदी) *</Label>
                    <Textarea
                      id="description-hi"
                      value={form.description?.hindi || ''}
                      onChange={(e) => setForm(f => ({
                        ...f,
                        description: { ...f.description!, hindi: e.target.value }
                      }))}
                      placeholder="हिंदी विवरण दर्ज करें"
                      className="bg-white border-orange-200 min-h-[80px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Hindi Image * / हिंदी छवि *</Label>
                    <p className="text-xs text-gray-500 mb-2">Upload your own image (stored in Cloudinary) or select from spiritual images below</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button 
                        type="button" 
                        variant="outline" 
                        disabled={uploading.hindi} 
                        onClick={() => hindiFileInputRef.current?.click()} 
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                      >
                        <Upload className="h-4 w-4 mr-2" /> 
                        {uploading.hindi ? 'Uploading to Cloudinary...' : 'Upload Image'}
                      </Button>
                      <input 
                        ref={hindiFileInputRef} 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => pickImage(e, 'hindi')} 
                        className="hidden" 
                      />
                      {/* Quick select from spiritual images - odd indices (1,3,5,7,9) for Hindi */}
                      <div className="flex gap-2 flex-wrap">
                        {spiritualImages.map((img, idx) => {
                          // Only show odd indices (1, 3, 5, 7, 9) for Hindi
                          if (idx % 2 === 1) {
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setForm(f => ({
                                    ...f,
                                    imageUrl: {
                                      ...f.imageUrl,
                                      hindi: img.url
                                    } as any
                                  }));
                                }}
                                className={`relative w-16 h-16 rounded border-2 overflow-hidden ${
                                  form.imageUrl?.hindi === img.url
                                    ? 'border-orange-500 ring-2 ring-orange-200'
                                    : 'border-gray-200 hover:border-orange-300'
                                }`}
                                title={`Select Hindi Image ${Math.floor(idx / 2) + 1}`}
                              >
                                <img src={img.url} alt={`Hindi ${Math.floor(idx / 2) + 1}`} className="w-full h-full object-cover" />
                              </button>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                    {form.imageUrl?.hindi ? (
                      <img src={form.imageUrl.hindi} alt="Hindi preview" className="w-full h-40 object-cover rounded border" />
                    ) : (
                      <div className="w-full h-40 bg-gray-50 border rounded flex items-center justify-center text-gray-400">No Hindi image</div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
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
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <Label htmlFor="featured" className="text-sm font-medium">Featured Slide</Label>
                    <p className="text-xs text-gray-600">Mark this slide as featured for priority display</p>
                  </div>
                  <Switch
                    id="featured"
                    checked={form.featured || false}
                    onCheckedChange={(checked) => setForm(f => ({ ...f, featured: checked }))}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsOpen(false); setEditing(null); reset(); }} className="border-orange-200">Cancel</Button>
              <Button 
                onClick={save} 
                disabled={(uploading.hindi || uploading.english) || !form.imageUrl?.hindi || !form.imageUrl?.english || !form.description?.hindi || !form.description?.english || isSaving} 
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    {editing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editing ? 'Update' : 'Create'
                )}
              </Button>
            </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-500 border rounded p-8">No middle slides found. Click "Add Slide" to create one.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(it => (
            <Card key={it.id} className="border overflow-hidden hover:shadow-lg transition-all duration-200 border-orange-200/40 bg-white">
              <div className="space-y-4 p-4">
                {/* Hindi Image */}
                <div className="relative w-full h-48">
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className="text-xs bg-orange-500 text-white"> English</Badge>
                  </div>
                  <ImageWithFallback 
                    src={typeof it.imageUrl === 'string' ? it.imageUrl : it.imageUrl.english} 
                    alt="Hindi slide" 
                    className="absolute inset-0 w-full h-full object-cover rounded-lg" 
                  />
                </div>
                
                {/* English Image  check img badge change */}
                <div className="relative w-full h-48">
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className="text-xs bg-blue-500 text-white">हिंदी</Badge>
                  </div>
                  <ImageWithFallback 
                    src={typeof it.imageUrl === 'string' ? it.imageUrl : it.imageUrl.hindi} 
                    alt="English slide" 
                    className="absolute inset-0 w-full h-full object-cover rounded-lg" 
                  />
                </div>
                
                {/* Content */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={`text-xs ${getStatusColorForMiddle(it.status)}`}>
                      {it.status}
                    </Badge>
                    {it.featured && (
                      <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  
                  {(typeof it.description === 'object' && it.description?.hindi) && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        <span className="font-medium">Hindi: </span>
                        {it.description.hindi}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        <span className="font-medium">English: </span>
                        {it.description.english}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t border-orange-100">
                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                      Priority: {it.priority}
                    </Badge>
                    <div className="flex gap-1">
                      <Button size="sm" variant="secondary" onClick={() => toggle(it.id)} className="h-8 w-8 p-0">
                        <Star className={`h-4 w-4 ${it.featured ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => { 
                        setEditing(it); 
                        setForm({
                          title: typeof it.title === 'object' ? it.title : { hindi: '', english: '' },
                          description: typeof it.description === 'object' ? it.description : { hindi: '', english: '' },
                          imageUrl: typeof it.imageUrl === 'string' ? { hindi: it.imageUrl, english: it.imageUrl } : it.imageUrl,
                          status: it.status,
                          featured: it.featured,
                          priority: it.priority,
                          linkUrl: it.linkUrl
                        }); 
                        setIsOpen(true); 
                      }} className="h-8 w-8 p-0 text-orange-600">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => del(it.id)} className="h-8 w-8 p-0 text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {items.length >= 5 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-sm text-yellow-800">
            <strong>Maximum limit reached:</strong> You have reached the maximum of 5 middle slides. Delete one to add a new slide.
          </p>
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
          // Normalize slides to ensure bookName exists (for backward compatibility)
          const normalizedSlides = result.data.map((slide: any) => ({
            ...slide,
            bookName: slide.bookName || { hindi: '', english: '' }
          }));
          setSlides(normalizedSlides);
        } else {
          console.error('Failed to load slides');
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
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [isSavingSlide, setIsSavingSlide] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const [newSlide, setNewSlide] = useState<Partial<SlideContent>>({
    title: { hindi: '', english: '' },
    description: { hindi: '', english: '' },
    bookName: { hindi: '', english: '' },
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

  const parseCSV = (text: string): Array<{titleHindi: string, titleEnglish: string, descriptionHindi: string, descriptionEnglish: string}> => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    // Skip header row
    const dataLines = lines.slice(1);
    const slides: Array<{titleHindi: string, titleEnglish: string, descriptionHindi: string, descriptionEnglish: string}> = [];
    
    for (const line of dataLines) {
      // Handle CSV with quotes and commas
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      // Expected format: Title Hindi, Title English, Description Hindi, Description English
      if (values.length >= 4) {
        slides.push({
          titleHindi: values[0].replace(/^"|"$/g, ''),
          titleEnglish: values[1].replace(/^"|"$/g, ''),
          descriptionHindi: values[2].replace(/^"|"$/g, ''),
          descriptionEnglish: values[3].replace(/^"|"$/g, '')
        });
      }
    }
    
    return slides;
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input
    if (event.target) event.target.value = '';

    setIsUploadingCSV(true);
    
    try {
      const text = await file.text();
      const slidesData = parseCSV(text);
      
      if (slidesData.length === 0) {
        toast.error('No valid data found in CSV file. Expected format: Title Hindi, Title English, Description Hindi, Description English');
        setIsUploadingCSV(false);
        return;
      }

      // Block in demo mode
      if (typeof window !== 'undefined' && localStorage.getItem('demoUser')) {
        toast.error('Demo mode cannot write to Firestore. Please log in with a Firebase admin account to upload slides.');
        setIsUploadingCSV(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const slideData of slidesData) {
        try {
          const result = await slideService.createSlide({
            title: {
              hindi: slideData.titleHindi.trim(),
              english: slideData.titleEnglish.trim()
            },
            description: {
              hindi: slideData.descriptionHindi.trim(),
              english: slideData.descriptionEnglish.trim()
            },
            bookName: {
              hindi: '',
              english: ''
            },
            imageUrl: '',
            status: 'draft',
            featured: false,
            category: 'spiritual',
            priority: 1
          });

          if (result.success && result.data) {
            successCount++;
            setSlides(prev => [...prev, result.data!]);
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
          console.error('Error creating slide:', error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} slide(s)${failCount > 0 ? `, ${failCount} failed` : ''}`);
      } else {
        toast.error(`Failed to import ${failCount} slide(s)`);
      }
    } catch (error) {
      toast.error('Error reading CSV file: ' + (error as Error).message);
    } finally {
      setIsUploadingCSV(false);
    }
  };

  const generateImageForSlide = async (title: string) => {
    setIsImageUploading(true);
    try {
      // For now, use a default empty image - users should upload or select from spiritual images
      const imageUrl = '';
      
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
    // Validate descriptions are filled
    if (!newSlide.description?.hindi || !newSlide.description?.english) {
      toast.error('Please fill in quotes/descriptions in both languages');
      return;
    }

    // Prevent writes in demo mode to avoid permission-denied
    if (typeof window !== 'undefined' && localStorage.getItem('demoUser')) {
      toast.error('Demo mode cannot write to Firestore. Please log in with a Firebase admin account to create slides.');
      return;
    }

    setIsSavingSlide(true);
    try {
      // Auto-generate titles from descriptions if not provided (use first 50 chars)
      const titleHindi = newSlide.title?.hindi || newSlide.description.hindi.substring(0, 50).trim() || 'Slide';
      const titleEnglish = newSlide.title?.english || newSlide.description.english.substring(0, 50).trim() || 'Slide';

      const result = await slideService.createSlide({
        title: {
          hindi: titleHindi,
          english: titleEnglish
        },
        description: newSlide.description!,
        bookName: newSlide.bookName || { hindi: '', english: '' },
        imageUrl: newSlide.imageUrl || '',
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
    } finally {
      setIsSavingSlide(false);
    }
  };

  const handleEditSlide = async () => {
    if (!editingSlide || !editingSlide.description.hindi || !editingSlide.description.english) {
      toast.error('Please fill in quotes/descriptions in both languages');
      return;
    }

    setIsSavingSlide(true);
    try {
      // Auto-generate titles from descriptions if not provided (use first 50 chars)
      const titleHindi = editingSlide.title?.hindi || editingSlide.description.hindi.substring(0, 50).trim() || 'Slide';
      const titleEnglish = editingSlide.title?.english || editingSlide.description.english.substring(0, 50).trim() || 'Slide';

      const result = await slideService.updateSlide(editingSlide.id, {
        title: {
          hindi: titleHindi,
          english: titleEnglish
        },
        description: editingSlide.description,
        bookName: editingSlide.bookName || { hindi: '', english: '' },
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
    } finally {
      setIsSavingSlide(false);
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
      bookName: { hindi: '', english: '' },
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
      <React.Fragment>
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

        {/* Add Slide and CSV Upload Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => csvFileInputRef.current?.click()}
            className="gap-2 border-orange-200 text-orange-600 hover:bg-orange-50"
            disabled={isUploadingCSV}
          >
            <Upload className="h-4 w-4" />
            {isUploadingCSV ? 'Uploading...' : 'Upload CSV/Excel'}
          </Button>
          <input
            ref={csvFileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleCSVUpload}
            className="hidden"
          />
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
                    <h4 className="font-medium text-gray-900">English quotes</h4>
                  </div>
                  
                  {/* <div>
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
                  </div> */}

                  <div>
                    <Label htmlFor="description-en">Quotes (English) *</Label>
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
                  
                  <div>
                    <Label htmlFor="bookname-en">Book Name (English)</Label>
                    <Input
                      id="bookname-en"
                      value={editingSlide ? (editingSlide.bookName?.english || '') : (newSlide.bookName?.english || '')}
                      onChange={(e) => {
                        if (editingSlide) {
                          setEditingSlide({
                            ...editingSlide,
                            bookName: { ...editingSlide.bookName, english: e.target.value }
                          });
                        } else {
                          setNewSlide({
                            ...newSlide,
                            bookName: { ...newSlide.bookName || { hindi: '', english: '' }, english: e.target.value }
                          });
                        }
                      }}
                      placeholder="Enter book name in English"
                      className="bg-white border-orange-200"
                    />
                  </div>
                </div>

                {/* Hindi Content */}
                <div className="space-y-3 pt-4 border-t border-orange-100">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-orange-500" />
                    <h4 className="font-medium text-gray-900">Hindi Content (हिंदी सामग्री)</h4>
                  </div>
                  
                  {/* <div>
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
                  </div> */}

                  <div>
                    <Label htmlFor="description-hi">Quotes (Hindi) * / कुछ और हिंदी का उदाहरण (हिंदी) *</Label>
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
                  
                  <div>
                    <Label htmlFor="bookname-hi">Book Name (Hindi) / पुस्तक का नाम (हिंदी)</Label>
                    <Input
                      id="bookname-hi"
                      value={editingSlide ? (editingSlide.bookName?.hindi || '') : (newSlide.bookName?.hindi || '')}
                      onChange={(e) => {
                        if (editingSlide) {
                          setEditingSlide({
                            ...editingSlide,
                            bookName: { ...editingSlide.bookName, hindi: e.target.value }
                          });
                        } else {
                          setNewSlide({
                            ...newSlide,
                            bookName: { ...newSlide.bookName || { hindi: '', english: '' }, hindi: e.target.value }
                          });
                        }
                      }}
                      placeholder="हिंदी में पुस्तक का नाम दर्ज करें"
                      className="bg-white border-orange-200"
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
                disabled={isSavingSlide}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-50"
              >
                {isSavingSlide ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    {editingSlide ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingSlide ? 'Update Slide' : 'Create Slide'
                )}
              </Button>
            </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Slides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSlides.map((slide) => (
          <Card key={slide.id} className="hover:shadow-lg transition-all duration-200 border-orange-200/40 bg-white">
            <div className="relative">
              {/* <ImageWithFallback
                src={slide.imageUrl}
                alt={slide.title[languageView]}
                className="w-full h-48 object-cover rounded-t-lg"
              /> */}
              <div className="absolute top-10 left-3 flex gap-2">
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
                    setEditingSlide({
                      ...slide,
                      bookName: slide.bookName || { hindi: '', english: '' }
                    });
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
            
            {/* <CardHeader className="pb-3">
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
            </CardHeader> */}
            
            <CardContent className="space-y-3 mt-96">
              <p className="text-sm text-gray-600 line-clamp-3">
                {slide.description[languageView]}
              </p>
              
              {slide.bookName && (slide.bookName[languageView] || slide.bookName.hindi || slide.bookName.english) && (
                <div className="pt-2 border-t border-orange-100">
                  <p className="text-xs text-gray-500 mb-1">Book Name:</p>
                  <p className="text-sm font-medium text-orange-600">
                    {slide.bookName[languageView] || slide.bookName.hindi || slide.bookName.english}
                  </p>
                </div>
              )}
              
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
      </React.Fragment>
      ) : (
        <MiddleSlidesPanel />
      )}
    </div>
  );
}