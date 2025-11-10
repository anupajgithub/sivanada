import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { ImageWithFallback } from './figma/ImageWithFallback';
import { BookOpen, Plus, Edit, Eye, FileText, Volume2 } from 'lucide-react';

// Mock book data
const mockHindiBooks = [
  {
    id: 1,
    title: "प्रेमचंद की कहानियां",
    author: "मुंशी प्रेमचंद",
    status: "Published",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop",
    category: "Literature",
    chapters: 12,
    audioChapters: 8
  },
  {
    id: 2,
    title: "हिंदी काव्य संग्रह",
    author: "विभिन्न कवि",
    status: "Draft",
    cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop",
    category: "Poetry",
    chapters: 6,
    audioChapters: 2
  }
];

const mockEnglishBooks = [
  {
    id: 3,
    title: "Shakespeare's Plays",
    author: "William Shakespeare",
    status: "Published",
    cover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop",
    category: "Drama",
    chapters: 15,
    audioChapters: 10
  },
  {
    id: 4,
    title: "Modern English Literature",
    author: "Various Authors",
    status: "Published",
    cover: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=300&h=400&fit=crop",
    category: "Literature",
    chapters: 20,
    audioChapters: 5
  }
];

export function BooksManagement() {
  const [activeTab, setActiveTab] = useState("hindi");
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);

  const currentBooks = activeTab === "hindi" ? mockHindiBooks : mockEnglishBooks;

  const getStatusBadge = (status: string) => {
    if (status === "Published") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">{status}</Badge>;
    } else {
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">{category}</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Books Management</h1>
          <p className="text-gray-600 text-lg">
            Manage Hindi and English books with chapter editing capabilities
          </p>
        </div>
        <Dialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen}>
          <DialogTrigger asChild>
            <Button className="gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl">
              <Plus className="h-5 w-5" />
              Add New Book
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl border-orange-200/40">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900">Add New Book</DialogTitle>
              <p className="text-gray-600">Create a new book in your content library</p>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Book Title</Label>
                <Input 
                  id="title" 
                  placeholder="Enter book title" 
                  className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author" className="text-sm font-semibold text-gray-700">Author Name</Label>
                <Input 
                  id="author" 
                  placeholder="Enter author name" 
                  className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language" className="text-sm font-semibold text-gray-700">Language</Label>
                <Select>
                  <SelectTrigger className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-orange-200/40">
                    <SelectItem value="hindi">Hindi</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-semibold text-gray-700">Category</Label>
                <Input 
                  id="category" 
                  placeholder="e.g., Literature, Poetry, Drama" 
                  className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddBookOpen(false)}
                  className="rounded-xl border-orange-200 text-gray-700 hover:bg-orange-50"
                >
                  Cancel
                </Button>
                <Button className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                  Create Book
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
                <CardTitle className="text-2xl font-bold text-gray-900">Content Library</CardTitle>
                <p className="text-gray-600 mt-1">Browse books by language</p>
              </div>
              <TabsList className="grid w-64 grid-cols-2 rounded-xl bg-orange-100/50 p-1">
                <TabsTrigger 
                  value="hindi" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm font-semibold"
                >
                  Hindi Books ({mockHindiBooks.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="english"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm font-semibold"
                >
                  English Books ({mockEnglishBooks.length})
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <TabsContent value="hindi" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {mockHindiBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="english" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {mockEnglishBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );

  function BookCard({ book }: { book: any }) {
    return (
      <Card className="group relative overflow-hidden border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-orange-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <CardContent className="relative p-6">
          <div className="flex gap-4">
            {/* Book Cover */}
            <div className="relative">
              <ImageWithFallback
                src={book.cover}
                alt={book.title}
                className="w-20 h-28 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
            </div>
            
            {/* Book Details */}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors duration-300">
                  {book.title}
                </h3>
                <p className="text-sm text-gray-600 font-medium">{book.author}</p>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(book.status)}
                {getCategoryBadge(book.category)}
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4 text-orange-500" />
                  <span>{book.chapters} chapters</span>
                </div>
                <div className="flex items-center gap-1">
                  <Volume2 className="h-4 w-4 text-orange-500" />
                  <span>{book.audioChapters} audio</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="rounded-lg border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  <BookOpen className="h-3 w-3 mr-1" />
                  Chapters
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
}