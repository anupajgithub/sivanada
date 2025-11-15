import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Image, Plus, Edit, Star, Download, Eye, Trash2 } from 'lucide-react';
import { wallpaperService, uploadService } from '../services';
import { toast } from 'sonner@2.0.3';

// Mock wallpaper data
const mockWallpapers = [
  {
    id: 1,
    title: "Sunset Mountains",
    category: "Nature",
    featured: true,
    downloads: 1250,
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop"
  },
  {
    id: 2,
    title: "Ocean Waves",
    category: "Nature",
    featured: false,
    downloads: 890,
    url: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&h=600&fit=crop"
  },
  {
    id: 3,
    title: "City Lights",
    category: "Urban",
    featured: true,
    downloads: 2100,
    url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=600&fit=crop"
  },
  {
    id: 4,
    title: "Abstract Art",
    category: "Abstract",
    featured: false,
    downloads: 567,
    url: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=600&fit=crop"
  },
  {
    id: 5,
    title: "Forest Path",
    category: "Nature",
    featured: false,
    downloads: 734,
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop"
  },
  {
    id: 6,
    title: "Space Galaxy",
    category: "Space",
    featured: true,
    downloads: 1876,
    url: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=600&fit=crop"
  }
];

const categories = ["All", "Nature", "Urban", "Abstract", "Space"];

export function WallpapersManagement() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isAddWallpaperOpen, setIsAddWallpaperOpen] = useState(false);
  const [wallpapers, setWallpapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form state for new wallpapers (multiple files)
  const [newWallpapers, setNewWallpapers] = useState<File[]>([]);

  // Load wallpapers from Firebase
  useEffect(() => {
    const loadWallpapers = async () => {
      try {
        const result = await wallpaperService.getWallpapers();
        if (result.success && result.data) {
          setWallpapers(result.data);
        } else {
          console.error('Failed to load wallpapers:', result.error);
        }
      } catch (error) {
        console.error('Error loading wallpapers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWallpapers();
  }, []);

  const filteredWallpapers = selectedCategory === "All" 
    ? wallpapers 
    : wallpapers.filter(w => w.category === selectedCategory);

  const handleUploadWallpapers = async () => {
    if (newWallpapers.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const imageFile of newWallpapers) {
        try {
          // Create wallpaper without title
          const result = await wallpaperService.createWallpaper({
            title: `Wallpaper ${Date.now()}`, // Auto-generated title
            category: 'nature',
            featured: false,
            downloadCount: 0
          });

          if (result.success && result.data) {
            // Upload image to Cloudinary
            const uploadResult = await uploadService.uploadImage(imageFile, `wallpapers/${result.data.id}`);
            if (uploadResult.success) {
              // Update wallpaper with image URL
              await wallpaperService.updateWallpaper(result.data.id, { imageUrl: uploadResult.url });
              successCount++;
            } else {
              failCount++;
              // Delete the created wallpaper if image upload failed
              await wallpaperService.deleteWallpaper(result.data.id);
            }
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
          console.error('Error uploading wallpaper:', error);
        }
      }
      
      // Reload wallpapers
      const reloadResult = await wallpaperService.getWallpapers();
      if (reloadResult.success && reloadResult.data) {
        setWallpapers(reloadResult.data);
      }
      
      // Reset form
      setNewWallpapers([]);
      setIsAddWallpaperOpen(false);
      
      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} wallpaper(s)${failCount > 0 ? `, ${failCount} failed` : ''}`);
      } else {
        toast.error(`Failed to upload ${failCount} wallpaper(s)`);
      }
    } catch (error) {
      toast.error('Error uploading wallpapers: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteWallpaper = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this wallpaper?')) {
      try {
        const result = await wallpaperService.deleteWallpaper(id);
        if (result.success) {
          setWallpapers(wallpapers.filter(w => w.id !== id));
          alert('Wallpaper deleted successfully!');
        } else {
          alert('Failed to delete wallpaper: ' + result.error);
        }
      } catch (error) {
        alert('Error deleting wallpaper: ' + (error as Error).message);
      }
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      const result = await wallpaperService.updateWallpaper(id, { featured: !currentFeatured });
      if (result.success) {
        setWallpapers(wallpapers.map(w => 
          w.id === id ? { ...w, featured: !currentFeatured } : w
        ));
        alert('Wallpaper updated successfully!');
      } else {
        alert('Failed to update wallpaper: ' + result.error);
      }
    } catch (error) {
      alert('Error updating wallpaper: ' + (error as Error).message);
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      Nature: "bg-green-100 text-green-700 border-green-200",
      Urban: "bg-blue-100 text-blue-700 border-blue-200",
      Abstract: "bg-purple-100 text-purple-700 border-purple-200",
      Space: "bg-indigo-100 text-indigo-700 border-indigo-200"
    };
    return <Badge className={`hover:${colors[category as keyof typeof colors]} ${colors[category as keyof typeof colors]}`}>{category}</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Wallpapers Gallery</h1>
          <p className="text-gray-600 text-lg">
            Manage wallpapers collection with categorization and featured content
          </p>
        </div>
        <Dialog open={isAddWallpaperOpen} onOpenChange={setIsAddWallpaperOpen}>
          <DialogTrigger asChild>
            <Button className="gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl">
              <Plus className="h-5 w-5" />
              Add Wallpaper
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl border-orange-200/40">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900">Add New Wallpaper</DialogTitle>
              <p className="text-gray-600">Upload a new wallpaper to the gallery</p>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="images" className="text-sm font-semibold text-gray-700">Upload Multiple Images</Label>
                <div 
                  className="border-2 border-dashed border-orange-200 rounded-xl p-8 text-center cursor-pointer hover:border-orange-300 transition-colors"
                  onClick={() => document.getElementById('images-upload')?.click()}
                >
                  <Image className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                  <p className="text-gray-600">Drag & drop images here, or click to browse</p>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 10MB each. Select multiple files.</p>
                  {newWallpapers.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-green-600 font-medium">{newWallpapers.length} image(s) selected:</p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {newWallpapers.map((file, index) => (
                          <p key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <input
                  id="images-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setNewWallpapers([...newWallpapers, ...files]);
                  }}
                  className="hidden"
                />
                {newWallpapers.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewWallpapers([])}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddWallpaperOpen(false);
                    setNewWallpapers([]);
                  }}
                  className="rounded-xl border-orange-200 text-gray-700 hover:bg-orange-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUploadWallpapers}
                  disabled={uploading || newWallpapers.length === 0}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  {uploading ? `Uploading ${newWallpapers.length}...` : `Upload ${newWallpapers.length} Wallpaper(s)`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Filter
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-xl transition-all duration-200 ${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg"
                    : "border-orange-200 text-gray-700 hover:bg-orange-50 hover:border-orange-300"
                }`}
              >
                {category} ({category === "All" ? wallpapers.length : wallpapers.filter(w => w.category === category).length})
              </Button>
            ))}
          </div>
        </CardContent>
      </Card> */}

      {/* Wallpapers Grid */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-50/50 to-orange-100/30 border-b border-orange-200/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Wallpapers Gallery ({filteredWallpapers.length})
              </CardTitle>
              <p className="text-gray-600 mt-1">Browse and manage wallpaper collection</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                {wallpapers.filter(w => w.featured).length} Featured
              </div>
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {wallpapers.reduce((acc, w) => acc + (w.downloadCount || 0), 0)} Downloads
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredWallpapers.map((wallpaper) => (
              <WallpaperCard key={wallpaper.id} wallpaper={wallpaper} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  function WallpaperCard({ wallpaper }: { wallpaper: any }) {
    return (
      <Card className="group relative overflow-hidden border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-orange-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <CardContent className="relative p-0">
          {/* Image */}
          <div className="relative aspect-[3/4] overflow-hidden">
            <ImageWithFallback
              src={wallpaper.imageUrl || wallpaper.url}
              alt={wallpaper.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            
            {/* Featured Badge */}
            {wallpaper.featured && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Featured
                </Badge>
              </div>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Action Buttons */}
            <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={() => handleToggleFeatured(wallpaper.id, wallpaper.featured)}
                className="flex-1 rounded-lg bg-white/90 text-gray-900 hover:bg-white"
              >
                <Star className={`h-3 w-3 mr-1 ${wallpaper.featured ? 'fill-current text-yellow-500' : ''}`} />
                {wallpaper.featured ? 'Unfeature' : 'Feature'}
              </Button>
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={() => handleDeleteWallpaper(wallpaper.id)}
                className="flex-1 rounded-lg bg-white/90 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
          
          {/* Details */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
                {wallpaper.title}
              </h3>
              <div className="flex items-center justify-between mt-2">
                {getCategoryBadge(wallpaper.category)}
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Download className="h-3 w-3" />
                  {(wallpaper.downloadCount || wallpaper.downloads || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        
        {/* Hover effect bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
      </Card>
    );
  }
}