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
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Bot, Plus, Edit, ArrowLeft, Save, Upload, Trash2, Volume2, Play, Pause, Clock, FileText } from 'lucide-react';
import { aiAudioService, uploadService } from '../services';
import { toast } from 'sonner@2.0.3';

// Helpers to map DB values to UI text
function toUiStatus(status: string) {
  return status === 'published' ? 'Published' : status === 'draft' ? 'Draft' : 'Archived';
}

export function AIAudioManagement() {
  const [activeTab, setActiveTab] = useState("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [viewMode, setViewMode] = useState<'categories' | 'chapters'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  useEffect(() => {
  const loadCategories = async () => {
    try {
      const result = await aiAudioService.getAllCategoriesWithContent();
      if (result.success && result.data) {
          const normalized = result.data.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            description: cat.description || '',
            status: toUiStatus(cat.status || 'draft'),
            imageUrl: cat.imageUrl || '',
            chapters: (cat.chapters || []).length,
            audioItemsCount: (cat.chapters || []).reduce((sum: number, ch: any) => 
              sum + (ch.audioItems?.length || 0), 0
            )
          }));
          setCategories(normalized);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };
    loadCategories();
  }, []);

  const getStatusBadge = (status: string) => {
    if (status === "Published") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">{status}</Badge>;
    } else {
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">{status}</Badge>;
    }
  };

  const handleDeleteCategory = async (category: any) => {
    if (!category?.id) return;
    const confirmDelete = window.confirm(`Delete "${category.name}" and all of its chapters and audio items?`);
    if (!confirmDelete) return;

    try {
      const res = await aiAudioService.deleteCategory(category.id);
      if (res.success) {
        toast.success('Category deleted successfully');
        if (selectedCategory?.id === category.id) {
          handleBackToCategories();
        }
      } else {
        toast.error(res.error || 'Failed to delete category');
      }
    } catch (error) {
      toast.error((error as Error).message || 'Failed to delete category');
    }
  };

  const handleViewChapters = async (category: any) => {
    setSelectedCategory(category);
    setViewMode('chapters');
    try {
      const result = await aiAudioService.getAllCategoriesWithContent();
      if (result.success && result.data) {
        const foundCategory = result.data.find((c: any) => c.id === category.id);
        if (foundCategory) {
          const normalizedChapters = (foundCategory.chapters || []).map((ch: any, idx: number) => {
            const firstAudioItem = (ch.audioItems || [])[0];
            const textContent = firstAudioItem?.text || '';
            const wordCount = textContent.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
            return {
              id: ch.id,
              title: ch.title,
              description: ch.description || '',
              order: ch.order || idx + 1,
              audioItemsCount: wordCount,
              audioItems: ch.audioItems || []
            };
          });
          setChapters(normalizedChapters);
        } else {
          setChapters([]);
        }
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
      setChapters([]);
    }
  };

  const handleBackToCategories = () => {
    setViewMode('categories');
    setSelectedCategory(null);
    setSelectedChapter(null);
    setChapters([]);
  };

  if (viewMode === 'chapters' && selectedCategory) {
    return (
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackToCategories}
              className="rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Categories
            </Button>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900">{selectedCategory.name}</h1>
              <p className="text-gray-600 text-lg">Manage chapters and audio items</p>
            </div>
          </div>
          <Button
            onClick={() => setIsAddChapterOpen(true)}
            className="gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl"
          >
            <Plus className="h-5 w-5" />
            Add Chapter
          </Button>
        </div>

        {/* Chapters Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chapters List */}
          <div className="lg:col-span-1">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-50/50 to-orange-100/30 border-b border-orange-200/40 p-6">
                <CardTitle className="text-xl font-bold text-gray-900">Chapters ({chapters.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  {chapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      onClick={() => setSelectedChapter(chapter)}
                      className={`p-4 border-b border-orange-100 cursor-pointer hover:bg-orange-50 transition-colors ${
                        selectedChapter?.id === chapter.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-orange-600">Chapter {chapter.order}</span>
                          {chapter.audioItemsCount > 0 && (
                            <Volume2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 line-clamp-2">{chapter.title}</h4>
                        <p className="text-xs text-gray-500">{chapter.audioItemsCount || 0} words</p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chapter Editor */}
          <div className="lg:col-span-2">
            {selectedChapter ? (
      <ChapterEditor
        chapter={selectedChapter}
        category={selectedCategory}
        onSave={(updatedChapter) => {
                  setChapters(chapters.map(ch => ch.id === updatedChapter.id ? updatedChapter : ch));
                  setSelectedChapter(updatedChapter);
                }}
                onDelete={async (chapterId) => {
                  if (!chapterId) return;
                  const confirmDelete = window.confirm('Delete this chapter and all its audio items?');
                  if (!confirmDelete) return;
                  try {
                    const res = await aiAudioService.deleteChapter(chapterId);
                    if (res.success) {
                      toast.success('Chapter deleted successfully');
                      const updated = chapters.filter(ch => ch.id !== chapterId);
                      setChapters(updated);
                      setSelectedChapter(null);
                    } else {
                      toast.error(res.error || 'Failed to delete chapter');
                    }
                  } catch (error) {
                    toast.error((error as Error).message || 'Failed to delete chapter');
                  }
                }}
              />
            ) : (
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden h-[600px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <FileText className="h-16 w-16 text-orange-300 mx-auto" />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Select a Chapter</h3>
                    <p className="text-gray-600">Choose a chapter from the list to start editing</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Add Chapter Dialog */}
        <Dialog open={isAddChapterOpen} onOpenChange={setIsAddChapterOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl border-orange-200/40">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900">Add New Chapter</DialogTitle>
            </DialogHeader>
            <AddChapterForm
              onSave={async (created) => {
                try {
                  const nextOrder = chapters.length + 1;
                  const res = await aiAudioService.createChapter({
                    categoryId: selectedCategory.id,
                    title: created.title,
                    description: created.description || '',
                    order: nextOrder
                  });
                  if (res.success && res.data) {
                    const chapter = {
                      id: res.data.id,
                      title: res.data.title,
                      description: res.data.description || '',
                      order: res.data.order || nextOrder,
                      audioItemsCount: 0,
                      audioItems: []
                    };
                    setChapters([...chapters, chapter]);
                    setIsAddChapterOpen(false);
                    toast.success('Chapter created successfully');
                  } else {
                    toast.error(res.error || 'Failed to create chapter');
                  }
                } catch (error) {
                  toast.error((error as Error).message || 'Failed to create chapter');
                }
              }}
              onCancel={() => setIsAddChapterOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">AI Audio Management</h1>
          <p className="text-gray-600 text-lg">
            Manage AI audio categories with chapters and audio items
          </p>
        </div>
        <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
          <DialogTrigger asChild>
            <Button className="gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl">
              <Plus className="h-5 w-5" />
              Add New Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl border-orange-200/40">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900">Add New Category</DialogTitle>
              <p className="text-gray-600">Create a new AI audio category</p>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Category Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter category name" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Enter category description" 
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image" className="text-sm font-semibold text-gray-700">Category Image</Label>
                <Input 
                  id="image" 
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                  className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="rounded-xl border-orange-200 text-gray-700 hover:bg-orange-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!newName.trim()) return;
                    const res = await aiAudioService.createCategory({
                      name: newName.trim(),
                      description: newDescription.trim(),
                      status: 'Draft'
                    });
                    if (res.success && res.data) {
                      if (newImageFile) {
                        const uploadResult = await uploadService.uploadImage(newImageFile, `ai-audio/categories/${res.data.id}`);
                        if (uploadResult.success && uploadResult.url) {
                          await aiAudioService.updateCategory(res.data.id, { imageUrl: uploadResult.url } as any);
                        }
                      }
                    setIsAddCategoryOpen(false);
                      setNewName(""); setNewDescription(""); setNewImageFile(null);
                      toast.success('Category created successfully');
                      // Reload categories
                      const reloadResult = await aiAudioService.getAllCategoriesWithContent();
                      if (reloadResult.success && reloadResult.data) {
                        const normalized = reloadResult.data.map((cat: any) => ({
                          id: cat.id,
                          name: cat.name,
                          description: cat.description || '',
                          status: toUiStatus(cat.status || 'draft'),
                          imageUrl: cat.imageUrl || '',
                          chapters: (cat.chapters || []).length,
                          audioItemsCount: (cat.chapters || []).reduce((sum: number, ch: any) => 
                            sum + (ch.audioItems?.length || 0), 0
                          )
                        }));
                        setCategories(normalized);
                      }
                  } else {
                      toast.error(res.error || 'Failed to create category');
                    }
                  }}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  Create Category
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl border-orange-200/40">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900">Edit Category</DialogTitle>
              <p className="text-gray-600">Update category information</p>
            </DialogHeader>
            <EditCategoryForm
              category={editingCategory}
              onSave={async (updatedCategory) => {
                if (editingCategory) {
                  const statusMap: any = {
                    'Published': 'published',
                    'Draft': 'draft',
                    'Archived': 'archived'
                  };
                  const result = await aiAudioService.updateCategory(editingCategory.id, {
                    name: updatedCategory.name,
                    description: updatedCategory.description,
                    status: statusMap[updatedCategory.status] || 'Draft',
                    imageUrl: updatedCategory.imageUrl
                  } as any);
                  if (result.success) {
                    setIsEditCategoryOpen(false);
                    setEditingCategory(null);
                    toast.success('Category updated successfully');
                    // Reload categories
                    const reloadResult = await aiAudioService.getAllCategoriesWithContent();
                    if (reloadResult.success && reloadResult.data) {
                      const normalized = reloadResult.data.map((cat: any) => ({
                        id: cat.id,
                        name: cat.name,
                        description: cat.description || '',
                        status: toUiStatus(cat.status || 'draft'),
                        imageUrl: cat.imageUrl || '',
                        chapters: (cat.chapters || []).length,
                        audioItemsCount: (cat.chapters || []).reduce((sum: number, ch: any) => 
                          sum + (ch.audioItems?.length || 0), 0
                        )
                      }));
                      setCategories(normalized);
                    }
                  } else {
                    toast.error(result.error || 'Failed to update category');
                  }
                }
              }}
              onCancel={() => {
                setIsEditCategoryOpen(false);
                setEditingCategory(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-50/50 to-orange-100/30 border-b border-orange-200/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">AI Audio Categories</CardTitle>
              <p className="text-gray-600 mt-1">Browse and manage AI audio categories</p>
          </div>
        </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
          ))}
        </div>
        </CardContent>
      </Card>
    </div>
  );

  function CategoryCard({ category }: { category: any }) {
  return (
    <Card className="group relative overflow-hidden border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-orange-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <CardContent className="relative p-6">
          <div className="flex gap-4">
            {/* Category Image/Icon */}
            <div className="relative">
              {category.imageUrl ? (
            <ImageWithFallback
              src={category.imageUrl}
              alt={category.name}
                  className="w-20 h-28 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-300"
                />
              ) : (
                <div className="w-20 h-28 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <Bot className="h-10 w-10 text-white" />
          </div>
        )}
            </div>
            
            {/* Category Details */}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors duration-300">
                {category.name}
              </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">{category.description}</p>
            </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(category.status)}
          </div>

          {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4 text-orange-500" />
                  <span>{category.chapters} chapters</span>
            </div>
                <div className="flex items-center gap-1">
                  <Volume2 className="h-4 w-4 text-orange-500" />
                  <span>{category.audioItemsCount} audio items</span>
            </div>
          </div>
          
          {/* Actions */}
              <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              variant="outline" 
                  onClick={() => {
                    setEditingCategory(category);
                    setIsEditCategoryOpen(true);
                  }}
                  className="rounded-lg border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button 
              size="sm" 
                  onClick={() => handleViewChapters(category)}
                  className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
                  <Bot className="h-3 w-3 mr-1" />
                  Chapters
            </Button>
            <Button
              size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteCategory(category)}
                  className="rounded-lg"
            >
              <Trash2 className="h-3 w-3 mr-1" />
                 
            </Button>
              </div>
          </div>
        </div>
      </CardContent>
      
        {/* Hover effect bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </Card>
  );
}

  function ChapterEditor({ chapter, category, onSave, onDelete }: { chapter: any; category: any; onSave: (chapter: any) => void; onDelete: (chapterId: string) => void }) {
    const [title, setTitle] = useState(chapter.title);
    const [text, setText] = useState('');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioUrl, setAudioUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const audioInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      // Load audio item for this chapter
      const loadAudioItem = async () => {
        try {
          const result = await aiAudioService.getAllCategoriesWithContent();
                  if (result.success && result.data) {
            const foundCategory = result.data.find((c: any) => c.id === category.id);
            if (foundCategory) {
              const foundChapter = foundCategory.chapters?.find((ch: any) => ch.id === chapter.id);
              if (foundChapter && foundChapter.audioItems && foundChapter.audioItems.length > 0) {
                const item = foundChapter.audioItems[0]; // Get first audio item
                setText(item.text || '');
                setAudioUrl(item.audioUrl || '');
              }
            }
                  }
                } catch (error) {
          console.error('Error loading audio item:', error);
        }
      };
      loadAudioItem();
    }, [chapter.id, category.id]);

    const handleSave = async () => {
      setIsSaving(true);
      try {
        // Update chapter title
        const chapterResult = await aiAudioService.updateChapter(chapter.id, { title, description: '' });
        if (!chapterResult.success) {
          toast.error('Failed to save chapter: ' + chapterResult.error);
          setIsSaving(false);
          return;
        }

        // Get or create audio item
        const result = await aiAudioService.getAllCategoriesWithContent();
        if (result.success && result.data) {
          const foundCategory = result.data.find((c: any) => c.id === category.id);
          if (foundCategory) {
            const foundChapter = foundCategory.chapters?.find((ch: any) => ch.id === chapter.id);
            let audioItemId = foundChapter?.audioItems?.[0]?.id;

            let finalAudioUrl = audioUrl;
            if (audioFile) {
              const uploadResult = await uploadService.uploadAudio(audioFile, `ai-audio/${audioItemId || chapter.id}`);
              if (uploadResult.success && uploadResult.url) {
                finalAudioUrl = uploadResult.url;
                      } else {
                toast.error('Failed to upload audio file');
                setIsSaving(false);
                return;
              }
            }

            if (audioItemId) {
              // Update existing audio item
              const updateResult = await aiAudioService.updateAudioItem(audioItemId, {
                title: 'Audio Item',
                text,
                status: 'Draft',
                audioUrl: finalAudioUrl
              });
              if (updateResult.success) {
                onSave({ ...chapter, title });
                toast.success('Chapter saved successfully');
              } else {
                toast.error('Failed to save audio item: ' + updateResult.error);
              }
            } else {
              // Create new audio item
              const createResult = await aiAudioService.createAudioItem({
                    chapterId: chapter.id,
                    categoryId: category.id,
                title: 'Audio Item',
                text,
                status: 'Draft',
                order: 1
              });
              if (createResult.success && createResult.data) {
                // If audio file was uploaded, update the item
                if (finalAudioUrl && finalAudioUrl !== audioUrl) {
                  await aiAudioService.updateAudioItem(createResult.data.id, {
                    title: 'Audio Item',
                    text,
                    status: 'Draft',
                    audioUrl: finalAudioUrl
                  });
                }
                onSave({ ...chapter, title });
                toast.success('Chapter saved successfully');
                  } else {
                toast.error('Failed to create audio item: ' + createResult.error);
              }
            }
          }
                  }
                } catch (error) {
        toast.error('Error saving chapter: ' + (error as Error).message);
      } finally {
        setIsSaving(false);
      }
    };

    const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setAudioFile(file);
      }
    };

    return (
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-50/50 to-orange-100/30 border-b border-orange-200/40 p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-900">Edit Chapter</CardTitle>
              <div className="flex gap-2">
                <Button
                onClick={() => onDelete(chapter.id)}
                variant="destructive"
                  size="sm"
                className="gap-2 rounded-xl"
                >
                <Trash2 className="h-4 w-4" />
                Delete
                </Button>
                <Button
                onClick={() => audioInputRef.current?.click()}
                variant="outline"
                  size="sm"
                className="gap-2 rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <Upload className="h-4 w-4" />
                Add Audio
                </Button>
                <Button
                onClick={handleSave}
                  disabled={isSaving}
                  size="sm"
                className="gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save
                  </>
                )}
                </Button>
              </div>
      </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Chapter Title */}
          <div className="space-y-2">
            <Label htmlFor="chapter-title" className="text-sm font-semibold text-gray-700">Chapter Title</Label>
            <Input
              id="chapter-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
              placeholder="Enter chapter title"
            />
      </div>

          {/* Text Content */}
          <div className="space-y-2">
            <Label htmlFor="chapter-content" className="text-sm font-semibold text-gray-700">Chapter Content</Label>
            <Textarea
              id="chapter-content"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20 min-h-[400px]"
              placeholder="Enter text content, script, or transcript..."
            />
            <div className="text-right">
              <span className="text-sm text-gray-500">{text.length} characters</span>
              </div>
          </div>

          {/* Audio Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Audio File</Label>
            <div className="flex gap-2">
              <Button
                onClick={() => audioInputRef.current?.click()}
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <Upload className="h-4 w-4" />
                {audioFile || audioUrl ? 'Change Audio' : 'Add Audio'}
              </Button>
            </div>
              <input
              ref={audioInputRef}
                type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
                className="hidden"
              />
            
            {(audioFile || audioUrl) && (
              <AudioPlayer 
                audioUrl={audioUrl || (audioFile ? URL.createObjectURL(audioFile) : '')}
                fileName={audioFile ? audioFile.name : 'Audio File'}
                duration=""
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  function AudioItemEditor({ audioItem, onSave, onClose }: { audioItem: any; onSave: (item: any) => void; onClose: () => void }) {
    const [text, setText] = useState(audioItem.text || '');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const audioInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
      setIsSaving(true);
      try {
        let audioUrl = audioItem.audioUrl;
        if (audioFile) {
          const uploadResult = await uploadService.uploadAudio(audioFile, `ai-audio/${audioItem.id}`);
          if (uploadResult.success && uploadResult.url) {
            audioUrl = uploadResult.url;
    } else {
            toast.error('Failed to upload audio file');
            setIsSaving(false);
            return;
          }
        }

        const result = await aiAudioService.updateAudioItem(audioItem.id, {
          title: audioItem.title || 'Audio Item', // Keep existing title
          text,
          status: audioItem.status || 'Draft', // Keep existing status
          audioUrl: audioUrl
        });

        if (result.success) {
          const updatedItem = {
            ...audioItem,
      text,
            audioFile: audioFile ? audioFile.name : audioItem.audioFile,
            audioUrl: audioUrl
          };
          onSave(updatedItem);
          toast.success('Audio item saved successfully');
    } else {
          toast.error('Failed to save audio item: ' + result.error);
        }
      } catch (error) {
        toast.error('Error saving audio item: ' + (error as Error).message);
      } finally {
        setIsSaving(false);
      }
    };

    const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  return (
      <div className="space-y-4 p-4 border border-orange-200 rounded-xl bg-orange-50/30">
      <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">Edit Audio Item</h4>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            ×
        </Button>
      </div>

        <div className="space-y-4">
            <div className="space-y-2">
            <Label htmlFor="audio-item-text" className="text-sm font-semibold text-gray-700">Text Content</Label>
            <Textarea
              id="audio-item-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20 min-h-[200px]"
              placeholder="Enter text content, script, or transcript..."
            />
            <div className="text-right">
              <span className="text-sm text-gray-500">{text.length} characters</span>
            </div>
            </div>
            
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Audio File</Label>
                <div className="flex gap-2">
                  <Button 
                onClick={() => audioInputRef.current?.click()}
                    variant="outline" 
                    size="sm" 
                className="gap-2 rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    <Upload className="h-4 w-4" />
                {audioFile || audioItem.audioFile ? 'Change Audio' : 'Add Audio'}
                  </Button>
                </div>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              className="hidden"
            />
              
              {(audioFile || audioItem.audioFile || audioItem.audioUrl) && (
              <AudioPlayer 
                audioUrl={audioItem.audioUrl || (audioFile ? URL.createObjectURL(audioFile) : '')}
                fileName={audioFile ? audioFile.name : audioItem.audioFile || 'Audio File'}
                duration={audioItem.duration}
              />
                        )}
                      </div>

          <div className="flex justify-end gap-2">
                      <Button
              onClick={onClose}
              variant="outline"
                        size="sm"
              className="rounded-xl border-orange-200 text-gray-700 hover:bg-orange-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Clock className="h-4 w-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </>
              )}
                      </Button>
                    </div>
                  </div>
                    </div>
    );
  }

  function AddChapterForm({ onSave, onCancel }: { onSave: (chapter: any) => void; onCancel: () => void }) {
    const [title, setTitle] = useState('');

    return (
      <div className="space-y-6">
            <div className="space-y-2">
          <Label htmlFor="new-chapter-title" className="text-sm font-semibold text-gray-700">Chapter Title</Label>
          <Input
            id="new-chapter-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter chapter title"
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
            onClick={() => {
              if (!title.trim()) {
                toast.error('Please enter a chapter title');
                return;
              }
              onSave({ title: title.trim(), description: '' });
            }}
            disabled={!title.trim()}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            Add Chapter
          </Button>
      </div>
    </div>
  );
}

  function EditCategoryForm({ category, onSave, onCancel }: { category: any; onSave: (category: any) => void; onCancel: () => void }) {
    const [name, setName] = useState(category?.name || '');
    const [description, setDescription] = useState(category?.description || '');
    const [status, setStatus] = useState(category?.status || 'Draft');
  const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState(category?.imageUrl || '');
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
        const result = await uploadService.uploadImage(file, `ai-audio/categories/${category.id}`);
        if (result.success && result.url) {
        setImagePreview(result.url);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="edit-category-name" className="text-sm font-semibold text-gray-700">Category Name</Label>
          <Input 
            id="edit-category-name" 
            placeholder="Enter category name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-category-description" className="text-sm font-semibold text-gray-700">Description</Label>
          <Textarea 
            id="edit-category-description" 
            placeholder="Enter category description" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-category-status" className="text-sm font-semibold text-gray-700">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-orange-200/40">
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Published">Published</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-category-image" className="text-sm font-semibold text-gray-700">Category Image</Label>
        {imagePreview && (
          <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-orange-200/40">
            <ImageWithFallback
              src={imagePreview}
              alt="Category preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}
          <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => imageInputRef.current?.click()}
              className="gap-2 rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50"
        >
          <Upload className="h-4 w-4" />
          {imagePreview ? 'Change Image' : 'Upload Image'}
        </Button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>
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
            onClick={() => {
              if (!name.trim()) {
                toast.error('Please enter a category name');
                return;
              }
      onSave({
                name: name.trim(),
        description: description.trim(),
                status,
                imageUrl: imagePreview
              });
            }}
            disabled={!name.trim()}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            Update Category
        </Button>
      </div>
    </div>
  );
}

  function AddAudioItemForm({ chapterId, categoryId, onSave, onCancel }: { chapterId: string; categoryId: string; onSave: (item: any) => void; onCancel: () => void }) {
  const [text, setText] = useState('');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
          <Label htmlFor="new-audio-item-text" className="text-sm font-semibold text-gray-700">Text Content</Label>
          <Textarea
            id="new-audio-item-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text content or script..."
            className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20 min-h-[200px]"
          />
          <div className="text-right">
            <span className="text-sm text-gray-500">{text.length} characters</span>
      </div>
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
            onClick={() => {
              onSave({
                title: 'Audio Item', // Default title
                text: text.trim(),
                status: 'draft'
              });
            }}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
          Add Audio Item
        </Button>
      </div>
    </div>
  );
}

function AudioPlayer({ audioUrl, fileName, duration }: { audioUrl: string; fileName: string; duration?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const togglePlayback = () => {
      if (audioUrl) {
    if (!audioElement) {
      const audio = new Audio(audioUrl);
          audio.onended = () => setIsPlaying(false);
      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration);
      };
      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };
      setAudioElement(audio);
    }

    if (isPlaying) {
          audioElement?.pause();
      setIsPlaying(false);
    } else {
          audioElement?.play();
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
      <div className="p-4 bg-green-50 rounded-xl border border-green-200">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">{fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            {audioDuration > 0 && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(audioDuration)}
              </span>
            )}
            <Button
              onClick={togglePlayback}
              size="sm"
                variant="ghost"
                className="text-green-600 hover:bg-green-100 w-8 h-8 rounded-full p-0"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        {audioDuration > 0 && (
          <div className="space-y-1">
              <div className="w-full bg-green-200 rounded-full h-1.5">
              <div 
                  className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(currentTime / audioDuration) * 100}%` }}
              ></div>
            </div>
              <div className="flex justify-between text-xs text-green-600">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(audioDuration)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  }
}
