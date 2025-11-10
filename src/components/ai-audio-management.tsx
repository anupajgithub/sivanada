import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ImageWithFallback } from './figma/ImageWithFallback';
import { 
  Bot, Plus, Edit, ArrowLeft, Save, Upload, Trash2, 
  FolderPlus, FileAudio, Volume2, Play, Pause, Clock, ChevronRight,
  ImageIcon
} from 'lucide-react';
import { aiAudioService, uploadService } from '../services';

// Mock AI Audio data with categories and chapters
const mockAIAudioCategories = [
  {
    id: 1,
    name: "Meditation Music",
    description: "AI-generated meditation and relaxation music",
    imageUrl: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400",
    status: "Published",
    createdAt: "2024-01-15",
    chapters: [
      {
        id: 101,
        categoryId: 1,
        title: "Morning Meditation",
        description: "Peaceful morning meditation music",
        order: 1,
        audioItems: [
          {
            id: 1001,
            chapterId: 101,
            title: "Sunrise Meditation",
            text: "Close your eyes and breathe deeply. Feel the warmth of the rising sun...",
            audioFile: "sunrise_meditation.mp3",
            duration: "10:30",
            status: "Published",
            order: 1
          },
          {
            id: 1002,
            chapterId: 101,
            title: "Energy Awakening",
            text: "As the new day begins, awaken your inner energy...",
            audioFile: "energy_awakening.mp3",
            duration: "8:45",
            status: "Published",
            order: 2
          }
        ]
      },
      {
        id: 102,
        categoryId: 1,
        title: "Evening Relaxation",
        description: "Calming evening meditation tracks",
        order: 2,
        audioItems: [
          {
            id: 1003,
            chapterId: 102,
            title: "Peaceful Sunset",
            text: "Let go of the day's worries as the sun sets...",
            audioFile: "peaceful_sunset.mp3",
            duration: "12:00",
            status: "Published",
            order: 1
          }
        ]
      }
    ]
  },
  {
    id: 2,
    name: "Motivational Speeches",
    description: "AI-generated motivational content",
    imageUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400",
    status: "Published",
    createdAt: "2024-01-20",
    chapters: [
      {
        id: 201,
        categoryId: 2,
        title: "Daily Motivation",
        description: "Start your day with motivation",
        order: 1,
        audioItems: [
          {
            id: 2001,
            chapterId: 201,
            title: "Believe in Yourself",
            text: "You have within you the strength to overcome any challenge...",
            audioFile: "believe_yourself.mp3",
            duration: "5:30",
            status: "Published",
            order: 1
          }
        ]
      }
    ]
  }
];

type ViewMode = 'categories' | 'chapters' | 'audioItems' | 'editCategory' | 'editChapter' | 'editAudioItem';

export function AIAudioManagement() {
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [selectedAudioItem, setSelectedAudioItem] = useState<any>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  const [isAddAudioItemOpen, setIsAddAudioItemOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load categories from Firebase
  const loadCategories = async () => {
    try {
      console.log('Loading AI Audio categories...');
      const result = await aiAudioService.getAllCategoriesWithContent();
      console.log('AI Audio service result:', result);
      
      if (result.success && result.data) {
        // Ensure all categories have proper structure
        const normalizedCategories = result.data.map((category: any) => ({
          id: category.id || `category-${Math.random()}`,
          name: category.name || 'Untitled Category',
          description: category.description || '',
          status: category.status || 'Draft',
          imageUrl: category.imageUrl || '',
          chapters: category.chapters || []
        }));
        console.log('Normalized categories:', normalizedCategories);
        setCategories(normalizedCategories);
      } else {
        console.error('Failed to load categories:', result.error);
        // Fallback to empty array if no data
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to empty array on error
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Navigate to chapters view
  const handleViewChapters = (category: any) => {
    setSelectedCategory(category);
    setViewMode('chapters');
  };

  // Navigate to audio items view
  const handleViewAudioItems = (chapter: any) => {
    setSelectedChapter(chapter);
    setViewMode('audioItems');
  };

  // Edit handlers
  const handleEditCategory = (category: any) => {
    setSelectedCategory(category);
    setViewMode('editCategory');
  };

  const handleEditChapter = (chapter: any) => {
    setSelectedChapter(chapter);
    setViewMode('editChapter');
  };

  const handleEditAudioItem = (audioItem: any) => {
    setSelectedAudioItem(audioItem);
    setViewMode('editAudioItem');
  };

  // Back navigation
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedChapter(null);
    setViewMode('categories');
  };

  const handleBackToChapters = () => {
    setSelectedChapter(null);
    setViewMode('chapters');
  };

  // Render based on view mode
  if (viewMode === 'editCategory' && selectedCategory) {
    return (
      <CategoryEditor
        category={selectedCategory}
        onSave={(updatedCategory) => {
          setCategories(categories.map(cat => 
            cat.id === updatedCategory.id ? updatedCategory : cat
          ));
          handleBackToCategories();
        }}
        onBack={handleBackToCategories}
      />
    );
  }

  if (viewMode === 'editChapter' && selectedChapter) {
    return (
      <ChapterEditor
        chapter={selectedChapter}
        category={selectedCategory}
        onSave={(updatedChapter) => {
          setCategories(categories.map(cat => {
            if (cat.id === selectedCategory.id) {
              return {
                ...cat,
                chapters: cat.chapters.map((ch: any) => 
                  ch.id === updatedChapter.id ? updatedChapter : ch
                )
              };
            }
            return cat;
          }));
          handleBackToChapters();
        }}
        onBack={handleBackToChapters}
      />
    );
  }

  if (viewMode === 'editAudioItem' && selectedAudioItem) {
    return (
      <AudioItemEditor
        audioItem={selectedAudioItem}
        chapter={selectedChapter}
        onSave={(updatedAudioItem) => {
          setCategories(categories.map(cat => {
            if (cat.id === selectedCategory.id) {
              return {
                ...cat,
                chapters: cat.chapters.map((ch: any) => {
                  if (ch.id === selectedChapter.id) {
                    return {
                      ...ch,
                      audioItems: ch.audioItems.map((item: any) => 
                        item.id === updatedAudioItem.id ? updatedAudioItem : item
                      )
                    };
                  }
                  return ch;
                })
              };
            }
            return cat;
          }));
          setViewMode('audioItems');
        }}
        onBack={() => setViewMode('audioItems')}
      />
    );
  }

  if (viewMode === 'chapters' && selectedCategory) {
    return (
      <ChaptersView
        category={selectedCategory}
        onBack={handleBackToCategories}
        onViewAudioItems={handleViewAudioItems}
        onEditChapter={handleEditChapter}
        onAddChapter={(newChapter: any) => {
          // Update selected category with new chapter
          setCategories(prev => prev.map(cat => {
            if (cat.id === selectedCategory.id) {
              const updatedCat = {
                ...cat,
                chapters: [...(cat.chapters || []), newChapter]
              };
              setSelectedCategory(updatedCat);
              return updatedCat;
            }
            return cat;
          }));
        }}
        onDeleteChapter={(chapterId: string) => {
          setCategories(prev => prev.map(cat => {
            if (cat.id === selectedCategory.id) {
              const updated = {
                ...cat,
                chapters: (cat.chapters || []).filter((ch: any) => ch.id !== chapterId)
              };
              setSelectedCategory(updated);
              return updated;
            }
            return cat;
          }));
        }}
      />
    );
  }

  if (viewMode === 'audioItems' && selectedChapter) {
    return (
      <AudioItemsView
        chapter={selectedChapter}
        category={selectedCategory}
        onBack={handleBackToChapters}
        onEditAudioItem={handleEditAudioItem}
        onAddAudioItem={(newItem: any) => {
          // Update selected chapter with new audio item
          setCategories(prev => prev.map(cat => {
            if (cat.id === selectedCategory.id) {
              const updatedCat = {
                ...cat,
                chapters: cat.chapters.map((ch: any) => {
                  if (ch.id === selectedChapter.id) {
                    const updatedChapter = {
                      ...ch,
                      audioItems: [...(ch.audioItems || []), newItem]
                    };
                    setSelectedChapter(updatedChapter);
                    return updatedChapter;
                  }
                  return ch;
                })
              };
              return updatedCat;
            }
            return cat;
          }));
        }}
        onDeleteAudioItem={(itemId: string) => {
          setCategories(prev => prev.map(cat => {
            if (cat.id === selectedCategory.id) {
              const updatedCat = {
                ...cat,
                chapters: cat.chapters.map((ch: any) => {
                  if (ch.id === selectedChapter.id) {
                    const updatedChapter = {
                      ...ch,
                      audioItems: (ch.audioItems || []).filter((it: any) => it.id !== itemId)
                    };
                    setSelectedChapter(updatedChapter);
                    return updatedChapter;
                  }
                  return ch;
                })
              };
              return updatedCat;
            }
            return cat;
          }));
        }}
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-orange-600">Loading AI Audio Categories...</p>
        </div>
      </div>
    );
  }

  // Categories view (default)
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">AI Audio Management</h1>
          <p className="text-gray-600 text-lg">
            Manage AI-generated audio categories, chapters, and content
          </p>
        </div>
        <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
          <DialogTrigger asChild>
            <Button className="gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl">
              <FolderPlus className="h-5 w-5" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl border-orange-200/40">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900">Add New Category</DialogTitle>
              <p className="text-gray-600">Create a new AI audio category</p>
            </DialogHeader>
            <AddCategoryForm
              onSave={async (newCategory) => {
                try {
                  const result = await aiAudioService.createCategory({
                    name: newCategory.name,
                    description: newCategory.description,
                    status: newCategory.status as 'Published' | 'Draft'
                  });
                  
                  if (result.success && result.data) {
                    setIsAddCategoryOpen(false);
                    alert('Category created successfully');
                    // Refresh the categories list
                    loadCategories();
                  } else {
                    alert('Failed to create category: ' + result.error);
                  }
                } catch (error) {
                  alert('Error creating category: ' + (error as Error).message);
                }
              }}
              onCancel={() => setIsAddCategoryOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="h-12 w-12 text-orange-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No AI Audio Categories Yet</h3>
          <p className="text-gray-600 mb-6">Create your first AI audio category to get started</p>
          <Button 
            onClick={() => setIsAddCategoryOpen(true)}
            className="gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl"
          >
            <FolderPlus className="h-5 w-5" />
            Create First Category
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.id || `category-${Math.random()}`}
              category={category}
              onView={handleViewChapters}
              onEdit={handleEditCategory}
              onDelete={async (cat: any) => {
                if (!cat?.id) return;
                if (!window.confirm('Delete this category and all its chapters and audio?')) return;
                const res = await aiAudioService.deleteCategory(cat.id);
                if (res.success) {
                  setCategories(prev => prev.filter(c => c.id !== cat.id));
                } else {
                  alert(res.error || 'Failed to delete category');
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Category Card Component
function CategoryCard({ category, onView, onEdit, onDelete }: any) {
  const totalChapters = category.chapters.length;
  const totalAudioItems = category.chapters.reduce(
    (sum: number, ch: any) => sum + (ch.audioItems?.length || 0), 
    0
  );

  return (
    <Card className="group relative overflow-hidden border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-blue-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <CardContent className="relative p-0">
        {/* Category Image */}
        {category.imageUrl && (
          <div className="relative h-48 w-full overflow-hidden rounded-t-2xl">
            <ImageWithFallback
              src={category.imageUrl}
              alt={category.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="font-bold text-white text-xl line-clamp-1">
                {category.name}
              </h3>
            </div>
          </div>
        )}
        
        <div className="p-6">
          {/* Description */}
          {!category.imageUrl && (
            <div className="mb-4">
              <h3 className="font-bold text-gray-900 text-xl mb-2 group-hover:text-orange-600 transition-colors duration-300">
                {category.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
            </div>
          )}
          {category.imageUrl && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
            </div>
          )}
          
          {/* Status */}
          <div className="mb-4">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
              {category.status}
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="text-center p-2 bg-white/60 rounded-lg">
              <div className="font-semibold text-gray-900">{totalChapters}</div>
              <div className="text-gray-600">Chapters</div>
            </div>
            <div className="text-center p-2 bg-white/60 rounded-lg">
              <div className="font-semibold text-gray-900">{totalAudioItems}</div>
              <div className="text-gray-600">Audio Items</div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onEdit(category)}
              className="flex-1 rounded-lg border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button 
              size="sm" 
              onClick={() => onView(category)}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <ChevronRight className="h-3 w-3 mr-1" />
              View Chapters
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete?.(category)}
              className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
      
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </Card>
  );
}

// Chapters View Component
function ChaptersView({ category, onBack, onViewAudioItems, onEditChapter, onAddChapter, onDeleteChapter }: any) {
  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Categories
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
            <p className="text-gray-600 text-lg">{category.description}</p>
          </div>
        </div>
        <Dialog open={isAddChapterOpen} onOpenChange={setIsAddChapterOpen}>
          <DialogTrigger asChild>
            <Button className="gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl">
              <Plus className="h-5 w-5" />
              Add Chapter
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl border-orange-200/40">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900">Add New Chapter</DialogTitle>
              <p className="text-gray-600">Create a new chapter in {category.name}</p>
            </DialogHeader>
            <AddChapterForm
              categoryId={category.id}
              onSave={async (newChapter: any) => {
                try {
                  const result = await aiAudioService.createChapter({
                    categoryId: category.id,
                    title: newChapter.title,
                    description: newChapter.description,
                    order: newChapter.order || 1
                  });
                  
                  if (result.success && result.data) {
                    onAddChapter(result.data);
                    setIsAddChapterOpen(false);
                    alert('Chapter created successfully');
                  } else {
                    alert('Failed to create chapter: ' + result.error);
                  }
                } catch (error) {
                  alert('Error creating chapter: ' + (error as Error).message);
                }
              }}
              onCancel={() => setIsAddChapterOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Chapters List */}
      <div className="space-y-4">
        {(category.chapters || []).map((chapter: any, index: number) => (
          <Card key={chapter.id || `chapter-${index}`} className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{chapter.title}</h3>
                    <p className="text-sm text-gray-600">{chapter.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FileAudio className="h-4 w-4" />
                        {chapter.audioItems?.length || 0} Audio Items
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditChapter(chapter)}
                    className="rounded-lg border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onViewAudioItems(chapter)}
                    className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    <ChevronRight className="h-3 w-3 mr-1" />
                    View Audio
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!window.confirm('Delete this chapter and its audio items?')) return;
                      const res = await aiAudioService.deleteChapter(chapter.id);
                      if (res.success) {
                        onDeleteChapter?.(chapter.id);
                      } else {
                        alert(res.error || 'Failed to delete chapter');
                      }
                    }}
                    className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Audio Items View Component
function AudioItemsView({ chapter, category, onBack, onEditAudioItem, onAddAudioItem, onDeleteAudioItem }: any) {
  const [isAddAudioItemOpen, setIsAddAudioItemOpen] = useState(false);
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chapters
          </Button>
          <div>
            <div className="text-sm text-gray-500">{category.name}</div>
            <h1 className="text-3xl font-bold text-gray-900">{chapter.title}</h1>
            <p className="text-gray-600">{chapter.description}</p>
          </div>
        </div>
        <Dialog open={isAddAudioItemOpen} onOpenChange={setIsAddAudioItemOpen}>
          <DialogTrigger asChild>
            <Button className="gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl">
              <Plus className="h-5 w-5" />
              Add Audio Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl border-orange-200/40">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900">Add New Audio Item</DialogTitle>
              <p className="text-gray-600">Create a new audio item in {chapter.title}</p>
            </DialogHeader>
            <AddAudioItemForm
              chapterId={chapter.id}
              categoryId={category.id}
              onSave={async (newItem: any) => {
                try {
                  const result = await aiAudioService.createAudioItem({
                    chapterId: chapter.id,
                    categoryId: category.id,
                    title: newItem.title,
                    text: newItem.text,
                    status: newItem.status as 'Published' | 'Draft',
                    order: newItem.order || 1
                  });
                  
                  if (result.success && result.data) {
                    onAddAudioItem(result.data);
                    setIsAddAudioItemOpen(false);
                    alert('Audio item created successfully');
                  } else {
                    alert('Failed to create audio item: ' + result.error);
                  }
                } catch (error) {
                  alert('Error creating audio item: ' + (error as Error).message);
                }
              }}
              onCancel={() => setIsAddAudioItemOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Audio Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(chapter.audioItems || []).map((audioItem: any, index: number) => (
          <Card key={audioItem.id || `audio-item-${index}`} className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              {/* Audio Item Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{audioItem.title}</h3>
                  <Badge className="mt-1 bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                    {audioItem.status}
                  </Badge>
                </div>
              </div>

              {/* Audio Preview */}
              {(audioItem.audioFile || audioItem.audioUrl) ? (
                <AudioPlayer 
                  audioUrl={audioItem.audioUrl || audioItem.audioFile}
                  fileName={audioItem.audioFile || 'Audio File'}
                  duration={audioItem.duration}
                />
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                  <FileAudio className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No audio file uploaded</p>
                </div>
              )}

              {/* Text Preview */}
              <div className="mb-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-600 line-clamp-3">{audioItem.text}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditAudioItem(audioItem)}
                  className="flex-1 rounded-lg border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  onClick={() => {
                    const btn = document.activeElement as HTMLElement;
                    btn?.blur();
                  }}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (!window.confirm('Delete this audio item?')) return;
                    const res = await aiAudioService.deleteAudioItem(audioItem.id);
                    if (res.success) {
                      onDeleteAudioItem?.(audioItem.id);
                    } else {
                      alert(res.error || 'Failed to delete audio item');
                    }
                  }}
                  className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Category Editor Component
function CategoryEditor({ category, onSave, onBack }: any) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description);
  const [status, setStatus] = useState(category.status);
  const [imageUrl, setImageUrl] = useState(category.imageUrl || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(category.imageUrl || '');
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Upload to Cloudinary immediately for preview
      const result = await uploadService.uploadImage(file, `ai-audio/categories/${category.id}`);
      if (result.success) {
        setImagePreview(result.url);
      } else {
        // Fallback to local preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSave = async () => {
    const updates = { 
      name, 
      description, 
      status,
      imageUrl: imagePreview || imageUrl 
    };
    const res = await aiAudioService.updateCategory(category.id, updates as any);
    if (res.success && res.data) {
      onSave(res.data);
    } else {
      alert(res.error || 'Failed to update category');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Category</h1>
        </div>
        <Button onClick={handleSave} className="gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl">
          <Save className="h-5 w-5" />
          Save Changes
        </Button>
      </div>

      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
        <CardContent className="p-6 space-y-6">
          {/* Image Upload */}
          <div className="space-y-4">
            <Label>Category Image</Label>
            {imagePreview && (
              <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-orange-200/40">
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

          <div className="space-y-2">
            <Label>Category Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20 min-h-[100px]" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-orange-200/40">
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Chapter Editor Component
function ChapterEditor({ chapter, category, onSave, onBack }: any) {
  const [title, setTitle] = useState(chapter.title);
  const [description, setDescription] = useState(chapter.description);

  const handleSave = async () => {
    const res = await aiAudioService.updateChapter(chapter.id, { title, description });
    if (res.success && res.data) {
      onSave(res.data);
    } else {
      alert(res.error || 'Failed to update chapter');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="text-sm text-gray-500">{category.name}</div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Chapter</h1>
          </div>
        </div>
        <Button onClick={handleSave} className="gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl">
          <Save className="h-5 w-5" />
          Save Changes
        </Button>
      </div>

      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label>Chapter Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20 min-h-[100px]" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Audio Item Editor Component
function AudioItemEditor({ audioItem, chapter, onSave, onBack }: any) {
  const [title, setTitle] = useState(audioItem.title);
  const [text, setText] = useState(audioItem.text);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [status, setStatus] = useState(audioItem.status);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    const res = await aiAudioService.updateAudioItem(audioItem.id, {
      title,
      text,
      status,
      audioFile: audioFile ? audioFile.name : audioItem.audioFile
    } as any);
    if (res.success && res.data) {
      onSave(res.data);
    } else {
      alert(res.error || 'Failed to update audio item');
    }
  };

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      // Upload to Cloudinary immediately
      const result = await uploadService.uploadAudio(file, `ai-audio/${audioItem.id}`);
      if (result.success) {
        // Update the audio item with the new URL
        await aiAudioService.updateAudioItem(audioItem.id, { audioUrl: result.url });
        alert('Audio uploaded successfully to Cloudinary!');
      } else {
        alert('Failed to upload audio: ' + result.error);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="text-sm text-gray-500">{chapter.title}</div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Audio Item</h1>
          </div>
        </div>
        <Button onClick={handleSave} className="gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl">
          <Save className="h-5 w-5" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Audio Details */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-orange-50/50 to-orange-100/30 border-b border-orange-200/40 p-6">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <Volume2 className="h-6 w-6 text-orange-500" />
              Audio Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Audio File</Label>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      // Generate AI audio based on text content
                      alert('AI Audio Generation feature would be implemented here');
                    }} 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <Bot className="h-4 w-4" />
                    Generate
                  </Button>
                  <Button onClick={() => audioInputRef.current?.click()} variant="outline" size="sm" className="gap-2 rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50">
                    <Upload className="h-4 w-4" />
                    {audioFile || audioItem.audioFile ? 'Change Audio' : 'Upload Audio'}
                  </Button>
                </div>
              </div>
              
              <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
              
              {(audioFile || audioItem.audioFile || audioItem.audioUrl) && (
                <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <Volume2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{audioFile ? audioFile.name : audioItem.audioFile}</p>
                        {audioItem.duration && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {audioItem.duration}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this audio file?')) {
                            setAudioFile(null);
                            alert('Audio file deleted');
                          }
                        }}
                        variant="ghost"
                        size="sm"
                        className="w-10 h-10 rounded-full bg-white/60 hover:bg-white text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {audioItem.audioUrl && (
                    <div className="mt-4">
                      <AudioPlayer
                        audioUrl={audioItem.audioUrl}
                        fileName={audioFile ? audioFile.name : (audioItem.audioFile || 'Audio File')}
                        duration={audioItem.duration}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-orange-200/40">
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Text Content */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-orange-50/50 to-orange-100/30 border-b border-orange-200/40 p-6">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <FileAudio className="h-6 w-6 text-orange-500" />
              Text Content
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Label>Associated Text/Script</Label>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20 min-h-[400px] font-mono" placeholder="Enter the text content, script, or transcript..." />
              <div className="text-right">
                <span className="text-sm text-gray-500">{text.length} characters</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Add Category Form
function AddCategoryForm({ onSave, onCancel }: any) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Draft');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Upload to Cloudinary immediately for preview
      const result = await uploadService.uploadImage(file, 'ai-audio/categories');
      if (result.success) {
        setImagePreview(result.url);
      } else {
        // Fallback to local preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = () => {
    if (name.trim() && description.trim()) {
      onSave({ 
        name: name.trim(),
        description: description.trim(),
        status,
        imageUrl: imagePreview
      });
      setName('');
      setDescription('');
      setStatus('Draft');
      setImagePreview('');
      setImageFile(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Image Upload */}
      <div className="space-y-4">
        <Label>Category Image</Label>
        {imagePreview && (
          <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-orange-200/40">
            <ImageWithFallback
              src={imagePreview}
              alt="Category preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => imageInputRef.current?.click()}
          className="gap-2 rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50 w-full"
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

      <div className="space-y-2">
        <Label>Category Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter category name" className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20" />
      </div>
      
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter category description" className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20" />
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-orange-200/40">
            <SelectItem value="Published">Published</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} className="rounded-xl border-orange-200 text-gray-700 hover:bg-orange-50">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!name.trim() || !description.trim()} className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
          Add Category
        </Button>
      </div>
    </div>
  );
}

// Add Chapter Form
function AddChapterForm({ categoryId, onSave, onCancel }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (title.trim() && description.trim()) {
      onSave({
        categoryId,
        title: title.trim(),
        description: description.trim(),
        order: 1
      });
      setTitle('');
      setDescription('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Chapter Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter chapter title" className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20" />
      </div>
      
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter chapter description" className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20" />
      </div>
      
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} className="rounded-xl border-orange-200 text-gray-700 hover:bg-orange-50">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!title.trim() || !description.trim()} className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
          Add Chapter
        </Button>
      </div>
    </div>
  );
}

// Add Audio Item Form
function AddAudioItemForm({ chapterId, categoryId, onSave, onCancel }: any) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [status, setStatus] = useState('Draft');

  const handleSubmit = () => {
    if (title.trim() && text.trim()) {
      onSave({
        chapterId,
        categoryId,
        title: title.trim(),
        text: text.trim(),
        status,
        order: 1
      });
      setTitle('');
      setText('');
      setStatus('Draft');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter audio item title" className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20" />
      </div>
      
      <div className="space-y-2">
        <Label>Text Content</Label>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter text content or script..." className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20 min-h-[120px]" />
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-orange-200/40">
            <SelectItem value="Published">Published</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} className="rounded-xl border-orange-200 text-gray-700 hover:bg-orange-50">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!title.trim() || !text.trim()} className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
          Add Audio Item
        </Button>
      </div>
    </div>
  );
}

// Audio Player Component
function AudioPlayer({ audioUrl, fileName, duration }: { audioUrl: string; fileName: string; duration?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const togglePlayback = () => {
    console.log('Toggle playback clicked, audioUrl:', audioUrl);
    if (!audioUrl) {
      console.log('No audio URL provided');
      return;
    }

    if (!audioElement) {
      console.log('Creating new audio element');
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        console.log('Audio ended');
        setIsPlaying(false);
      };
      audio.onloadedmetadata = () => {
        console.log('Audio metadata loaded, duration:', audio.duration);
        setAudioDuration(audio.duration);
      };
      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };
      audio.onerror = (error) => {
        console.error('Audio error:', error);
        setIsPlaying(false);
      };
      setAudioElement(audio);
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((error) => {
          console.error('Audio play error:', error);
          setIsPlaying(false);
        });
      return;
    }

    if (isPlaying) {
      console.log('Pausing audio');
      audioElement.pause();
      setIsPlaying(false);
    } else {
      console.log('Playing audio');
      audioElement
        .play()
        .then(() => setIsPlaying(true))
        .catch((error) => {
          console.error('Audio play error:', error);
          setIsPlaying(false);
        });
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 bg-orange-50 rounded-xl mb-4 border border-orange-200">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">{fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            {audioDuration > 0 && (
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(audioDuration)}
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
        {audioDuration > 0 && (
          <div className="space-y-1">
            <div className="w-full bg-orange-200 rounded-full h-1.5">
              <div 
                className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(currentTime / audioDuration) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(audioDuration)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
