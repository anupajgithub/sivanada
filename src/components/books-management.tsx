import { useState, useRef, useEffect } from 'react';
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
import { BookOpen, Plus, Edit, Eye, FileText, Volume2, ArrowLeft, Save, Play, Upload, Bold, Italic, Image, Type, Trash2 } from 'lucide-react';
import { bookService, uploadService } from '../services';
import { toast } from 'sonner@2.0.3';

// Helpers to map DB values to UI text
function toUiStatus(status: string) {
  return status === 'published' ? 'Published' : status === 'draft' ? 'Draft' : 'Archived';
}

export function BooksManagement() {
  const [activeTab, setActiveTab] = useState("hindi");
  const [books, setBooks] = useState<any[]>([]);
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newLanguage, setNewLanguage] = useState("hindi");
  const [newCategory, setNewCategory] = useState("");
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [viewMode, setViewMode] = useState<'books' | 'chapters'>('books');
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  const [isEditBookOpen, setIsEditBookOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);

  const hindiBooks = books.filter(b => b.language === 'hindi');
  const englishBooks = books.filter(b => b.language === 'english');

  useEffect(() => {
    const unsub = bookService.subscribeToBooks({}, (list) => {
      const normalized = list.map((b: any) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        status: toUiStatus(b.status),
        cover: b.coverImage,
        category: b.category,
        chapters: b.totalChapters || (b.chapters ? b.chapters.length : 0),
        audioChapters: 0,
        language: b.language || 'hindi'
      }));
      setBooks(normalized);
    });
    return unsub;
  }, []);

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

  const handleDeleteBook = async (book: any) => {
    if (!book?.id) return;
    const confirmDelete = window.confirm(`Delete "${book.title}" and all of its chapters?`);
    if (!confirmDelete) return;

    try {
      const res = await bookService.deleteBook(book.id);
      if (res.success) {
        toast.success('Book deleted successfully');
        if (selectedBook?.id === book.id) {
          handleBackToBooks();
        }
      } else {
        toast.error(res.error || 'Failed to delete book');
      }
    } catch (error) {
      toast.error((error as Error).message || 'Failed to delete book');
    }
  };

  const handleViewChapters = (book: any) => {
    setSelectedBook(book);
    setViewMode('chapters');
    console.log("➡️ Viewing chapters for book:", book.id);
    bookService.getChapters(book.id).then((res) => {
      console.log("📦 getChapters response:", res);
      if (res.success && res.data) {
        setChapters(res.data.map((c: any) => ({
          id: c.id,
          title: c.title,
          content: c.content,
          audioFile: c.audioUrl || null,
          audioUrl: c.audioUrl || '',
          order: c.chapterNumber,
          wordCount: (c.content || '').replace(/<[^>]*>/g, '').trim().split(/\s+/).filter((w: string) => w.length > 0).length
        })));
      } else {
        setChapters([]);
      }
    });
  };

  const handleBackToBooks = () => {
    setViewMode('books');
    setSelectedBook(null);
    setSelectedChapter(null);
    setChapters([]);
  };

  // Rich Text Editor Component
  function RichTextEditor({ content, onChange }: { content: string; onChange: (content: string) => void }) {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const executeCommand = (command: string, value?: string) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
      // Get updated content
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          executeCommand('insertImage', imageUrl);
        };
        reader.readAsDataURL(file);
      }
    };

    const handleContentChange = () => {
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    };

    return (
      <div className="border border-orange-200 rounded-xl overflow-hidden bg-white">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 bg-orange-50/50 border-b border-orange-200">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => executeCommand('bold')}
            className="h-8 w-8 p-0 hover:bg-orange-100"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => executeCommand('italic')}
            className="h-8 w-8 p-0 hover:bg-orange-100"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6 bg-orange-200" />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-8 p-0 hover:bg-orange-100"
          >
            <Image className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Separator orientation="vertical" className="h-6 bg-orange-200" />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => executeCommand('formatBlock', 'h3')}
            className="h-8 px-3 hover:bg-orange-100 text-xs"
          >
            H3
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => executeCommand('formatBlock', 'p')}
            className="h-8 px-3 hover:bg-orange-100 text-xs"
          >
            P
          </Button>
        </div>
        
        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          dangerouslySetInnerHTML={{ __html: content }}
          className="min-h-[400px] p-4 focus:outline-none"
          style={{
            lineHeight: '1.6',
          }}
        />
      </div>
    );
  }

  if (viewMode === 'chapters' && selectedBook) {
    return (
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackToBooks}
              className="rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Books
            </Button>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900">{selectedBook.title}</h1>
              <p className="text-gray-600 text-lg">Manage chapters and content</p>
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
                          {chapter.audioFile && (
                            <Volume2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 line-clamp-2">{chapter.title}</h4>
                        <p className="text-xs text-gray-500">{chapter.wordCount} words</p>
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
                onSave={(updatedChapter) => {
                  setChapters(chapters.map(ch => ch.id === updatedChapter.id ? updatedChapter : ch));
                  setSelectedChapter(updatedChapter);
                }}
                onDelete={async (chapterId) => {
                  if (!chapterId) return;
                  const confirmDelete = window.confirm('Delete this chapter?');
                  if (!confirmDelete) return;
                  try {
                    const res = await bookService.deleteChapter(chapterId);
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
              onSave={(created) => {
                // Preserve Firestore IDs and use server-provided chapterNumber
                const chapter = {
                  id: created.id,
                  title: created.title,
                  content: created.content || "",
                  audioFile: created.audioUrl || null,
                  audioUrl: created.audioUrl || '',
                  order: created.chapterNumber,
                  wordCount: (created.content || '').replace(/<[^>]*>/g, '').trim().split(/\s+/).filter((w: string) => w.length > 0).length
                };
                setChapters([...chapters, chapter]);
                setIsAddChapterOpen(false);
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
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author" className="text-sm font-semibold text-gray-700">Author Name</Label>
                <Input 
                  id="author" 
                  placeholder="Enter author name" 
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language" className="text-sm font-semibold text-gray-700">Language</Label>
                <Select value={newLanguage} onValueChange={setNewLanguage}>
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
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cover" className="text-sm font-semibold text-gray-700">Cover Image</Label>
                <Input 
                  id="cover" 
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewCoverFile(e.target.files?.[0] || null)}
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
                <Button
                  onClick={async () => {
                    if (!newTitle.trim() || !newAuthor.trim()) return;
                    const now = new Date().toISOString();
                    const res = await bookService.createBook({
                      title: newTitle.trim(),
                      author: newAuthor.trim(),
                      description: '',
                      category: (['spiritual','educational','philosophy','meditation'] as any).includes(newCategory.toLowerCase()) ? newCategory.toLowerCase() : 'spiritual',
                      language: newLanguage as any,
                      status: 'draft',
                      coverImage: '',
                      rating: 0,
                      featured: false,
                    } as any);
                    if (res.success && res.data) {
                      if (newCoverFile) {
                        const uploadResult = await uploadService.uploadImage(newCoverFile, `books/covers/${res.data.id}`);
                        if (uploadResult.success && uploadResult.url) {
                          await bookService.updateBook(res.data.id, { coverImage: uploadResult.url });
                        }
                      }
                      setIsAddBookOpen(false);
                      setNewTitle(""); setNewAuthor(""); setNewLanguage('hindi'); setNewCategory(""); setNewCoverFile(null);
                    } else {
                      // eslint-disable-next-line no-alert
                      alert(res.error || 'Failed to create book');
                    }
                  }}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  Create Book
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Book Dialog */}
        <Dialog open={isEditBookOpen} onOpenChange={setIsEditBookOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl border-orange-200/40">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900">Edit Book</DialogTitle>
              <p className="text-gray-600">Update book information</p>
            </DialogHeader>
            <EditBookForm
              book={editingBook}
              onSave={async (updatedBook) => {
                if (editingBook) {
                  const result = await bookService.updateBook(editingBook.id, {
                    title: updatedBook.title,
                    author: updatedBook.author,
                    description: updatedBook.description || '',
                    category: updatedBook.category,
                    language: updatedBook.language,
                    status: updatedBook.status
                  });
                  if (result.success) {
                    setIsEditBookOpen(false);
                    setEditingBook(null);
                  } else {
                    alert('Failed to update book: ' + result.error);
                  }
                }
              }}
              onCancel={() => {
                setIsEditBookOpen(false);
                setEditingBook(null);
              }}
            />
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
                  Hindi Books ({hindiBooks.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="english"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm font-semibold"
                >
                  English Books ({englishBooks.length})
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <TabsContent value="hindi" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {hindiBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="english" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {englishBooks.map((book) => (
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
                  onClick={() => {
                    setEditingBook(book);
                    setIsEditBookOpen(true);
                  }}
                  className="rounded-lg border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleViewChapters(book)}
                  className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  <BookOpen className="h-3 w-3" />
                  Chapters
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteBook(book)}
                  className="rounded-lg"
                >
                  <Trash2 className="h-3 w-3" />
                  
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

  function ChapterEditor({ chapter, onSave, onDelete }: { chapter: any; onSave: (chapter: any) => void; onDelete: (chapterId: string) => void }) {
    const [title, setTitle] = useState(chapter.title);
    const [content, setContent] = useState(chapter.content);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    try {
      const result = await bookService.updateChapter(chapter.id, { title, content });
      if (result.success) {
        if (audioFile) {
          const uploadResult = await uploadService.uploadAudio(audioFile, `books/audio/${chapter.id}`);
          if (uploadResult.success && uploadResult.url) {
            // Update chapter with audio URL
            await bookService.updateChapter(chapter.id, { audioUrl: uploadResult.url });
            onSave({ ...chapter, title, content, audioFile: audioFile.name, audioUrl: uploadResult.url });
          } else {
            alert('Chapter updated but audio upload failed: ' + uploadResult.error);
            onSave({ ...chapter, title, content, audioFile: audioFile.name });
          }
        } else {
          onSave({ ...chapter, title, content });
        }
        alert('Chapter saved successfully');
      } else {
        alert('Failed to save chapter: ' + result.error);
      }
    } catch (error) {
      alert('Error saving chapter: ' + (error as Error).message);
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
                {audioFile || chapter.audioFile ? 'Change Audio' : 'Add Audio'}
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                className="gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                <Save className="h-4 w-4" />
                Save
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

          {/* Audio Upload */}
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            className="hidden"
          />
          
          {(audioFile || chapter.audioFile || chapter.audioUrl) && (
            <AudioPlayer 
              audioUrl={chapter.audioUrl || (audioFile ? URL.createObjectURL(audioFile) : '')}
              fileName={audioFile ? audioFile.name : chapter.audioFile || 'Audio File'}
              duration={chapter.duration}
            />
          )}

          {/* Rich Text Editor */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Chapter Content</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
            />
          </div>

          {/* Word Count */}
          <div className="text-right">
            <span className="text-sm text-gray-500">
              {content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(word => word.length > 0).length} words
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  function AddChapterForm({ onSave, onCancel }: { onSave: (chapter: any) => void; onCancel: () => void }) {
    const [title, setTitle] = useState('');

    const handleSubmit = async () => {
      if (!selectedBook) return;
      if (!title.trim()) return;
      // Block in demo mode to avoid Firestore permission errors
      if (typeof window !== 'undefined' && localStorage.getItem('demoUser')) {
        toast.error('Demo mode cannot write to Firestore. Please log in with a Firebase admin account to add chapters.');
        return;
      }
      try {
        const nextOrder = chapters.length + 1;
        const res = await bookService.createChapter({
          bookId: selectedBook.id,
          title: title.trim(),
          content: '',
          chapterNumber: nextOrder,
          status: 'draft'
        } as any);
        if (res.success && res.data) {
          onSave(res.data);
          setTitle('');
          toast.success('Chapter created');
        } else {
          toast.error(res.error || 'Failed to create chapter. Ensure you are logged in and your Firestore rules allow writes.');
        }
      } catch (e) {
        toast.error((e as Error).message || 'Failed to create chapter');
      }
    };

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
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            Add Chapter
          </Button>
        </div>
      </div>
    );
  }

  function EditBookForm({ book, onSave, onCancel }: { book: any; onSave: (book: any) => void; onCancel: () => void }) {
    const [title, setTitle] = useState(book?.title || '');
    const [author, setAuthor] = useState(book?.author || '');
    const [description, setDescription] = useState(book?.description || '');
    const [category, setCategory] = useState(book?.category || '');
    const [language, setLanguage] = useState(book?.language || 'hindi');
    const [status, setStatus] = useState(book?.status || 'draft');
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState(book?.coverImage || '');
    const coverInputRef = useRef<HTMLInputElement>(null);

    const handleCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setCoverFile(file);
        // Upload to Cloudinary immediately for preview
        const result = await uploadService.uploadImage(file, `books/covers/${book.id}`);
        if (result.success && result.url) {
          setCoverPreview(result.url);
        } else {
          // Fallback to local preview
          const reader = new FileReader();
          reader.onloadend = () => {
            setCoverPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    };

    const handleSubmit = async () => {
      if (title.trim() && author.trim()) {
        try {
          const updatedBook = {
            title: title.trim(),
            author: author.trim(),
            description: description.trim(),
            category: category.trim(),
            language,
            status,
            coverImage: coverPreview || book?.coverImage
          };
          
          // If cover was changed, upload it
          if (coverFile) {
            const uploadResult = await uploadService.uploadImage(coverFile, `books/covers/${book.id}`);
            if (uploadResult.success && uploadResult.url) {
              updatedBook.coverImage = uploadResult.url;
            } else {
              alert('Failed to upload cover image: ' + uploadResult.error);
              return;
            }
          }
          
          // Update the book in the database
          const result = await bookService.updateBook(book.id, updatedBook);
          if (result.success) {
            onSave(updatedBook);
            alert('Book updated successfully');
          } else {
            alert('Failed to update book: ' + result.error);
          }
        } catch (error) {
          alert('Error updating book: ' + (error as Error).message);
        }
      }
    };

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="edit-title" className="text-sm font-semibold text-gray-700">Book Title</Label>
          <Input 
            id="edit-title" 
            placeholder="Enter book title" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-author" className="text-sm font-semibold text-gray-700">Author Name</Label>
          <Input 
            id="edit-author" 
            placeholder="Enter author name" 
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-description" className="text-sm font-semibold text-gray-700">Description</Label>
          <Textarea 
            id="edit-description" 
            placeholder="Enter book description" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-language" className="text-sm font-semibold text-gray-700">Language</Label>
          <Select value={language} onValueChange={setLanguage}>
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
          <Label htmlFor="edit-category" className="text-sm font-semibold text-gray-700">Category</Label>
          <Input 
            id="edit-category" 
            placeholder="e.g., Literature, Poetry, Drama" 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-status" className="text-sm font-semibold text-gray-700">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-orange-200/40">
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cover Image Upload */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold text-gray-700">Cover Image</Label>
          {coverPreview && (
            <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-orange-200/40">
              <ImageWithFallback
                src={coverPreview}
                alt="Book cover preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => coverInputRef.current?.click()}
              className="gap-2 rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              <Upload className="h-4 w-4" />
              {coverPreview ? 'Change Cover' : 'Upload Cover'}
            </Button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
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
            onClick={handleSubmit}
            disabled={!title.trim() || !author.trim()}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            Update Book
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