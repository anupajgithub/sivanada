import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Image, Plus, Edit, Star, Download, Eye } from 'lucide-react';

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

  const filteredWallpapers = selectedCategory === "All" 
    ? mockWallpapers 
    : mockWallpapers.filter(w => w.category === selectedCategory);

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
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Wallpaper Title</Label>
                <Input 
                  id="title" 
                  placeholder="Enter wallpaper title" 
                  className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-semibold text-gray-700">Category</Label>
                <select className="w-full rounded-xl border border-orange-200/60 p-3 focus:border-orange-500 focus:ring-orange-500/20 focus:outline-none">
                  <option>Select category</option>
                  <option value="nature">Nature</option>
                  <option value="urban">Urban</option>
                  <option value="abstract">Abstract</option>
                  <option value="space">Space</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image" className="text-sm font-semibold text-gray-700">Image Upload</Label>
                <div className="border-2 border-dashed border-orange-200 rounded-xl p-8 text-center">
                  <Image className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                  <p className="text-gray-600">Drag & drop an image here, or click to browse</p>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 10MB</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddWallpaperOpen(false)}
                  className="rounded-xl border-orange-200 text-gray-700 hover:bg-orange-50"
                >
                  Cancel
                </Button>
                <Button className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                  Upload Wallpaper
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Filter */}
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
                {category} ({category === "All" ? mockWallpapers.length : mockWallpapers.filter(w => w.category === category).length})
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

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
                {mockWallpapers.filter(w => w.featured).length} Featured
              </div>
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {mockWallpapers.reduce((acc, w) => acc + w.downloads, 0)} Downloads
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
              src={wallpaper.url}
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
              <Button size="sm" variant="secondary" className="flex-1 rounded-lg bg-white/90 text-gray-900 hover:bg-white">
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button size="sm" variant="secondary" className="flex-1 rounded-lg bg-white/90 text-gray-900 hover:bg-white">
                <Eye className="h-3 w-3 mr-1" />
                View
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
                  {wallpaper.downloads.toLocaleString()}
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