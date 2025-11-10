import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Save, Trash2, Upload } from 'lucide-react';
import { aiAudioService } from '../services/aiAudioService';
import { uploadService } from '../services/uploadService';

// Extremely simple tree UI: Categories -> Chapters -> Audio Items
// No dialogs, no complex navigation; inline add/edit/delete

interface Ctx {
  id: string;
  name: string;
  description?: string;
  status?: 'Published' | 'Draft';
  chapters?: any[];
}

export function AIAudioSimple() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Ctx[]>([]);

  const load = async () => {
    setLoading(true);
    const res = await aiAudioService.getAllCategoriesWithContent();
    if (res.success && res.data) setCategories(res.data as any);
    else setCategories([]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Category ops
  const addCategory = async (cat: { name: string; description: string; status: 'Published' | 'Draft' }) => {
    const res = await aiAudioService.createCategory(cat as any);
    if (res.success && res.data) setCategories(prev => [res.data as any, ...prev]);
  };
  const updateCategory = async (id: string, updates: any) => {
    const res = await aiAudioService.updateCategory(id, updates);
    if (res.success && res.data) setCategories(prev => prev.map(c => (c.id === id ? (res.data as any) : c)));
  };
  const deleteCategory = async (id: string) => {
    const res = await aiAudioService.deleteCategory(id);
    if (res.success) setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Chapter ops
  const addChapter = async (catId: string, data: { title: string; description: string }) => {
    const res = await aiAudioService.createChapter({ categoryId: catId, title: data.title, description: data.description, order: 1 } as any);
    if (res.success && res.data) setCategories(prev => prev.map(c => (c.id === catId ? { ...c, chapters: [...(c.chapters || []), res.data] } : c)));
  };
  const updateChapter = async (catId: string, chapterId: string, updates: any) => {
    const res = await aiAudioService.updateChapter(chapterId, updates);
    if (res.success && res.data) setCategories(prev => prev.map(c => (c.id === catId ? { ...c, chapters: (c.chapters || []).map((ch: any) => (ch.id === chapterId ? res.data : ch)) } : c)));
  };
  const deleteChapter = async (catId: string, chapterId: string) => {
    const res = await aiAudioService.deleteChapter(chapterId);
    if (res.success) setCategories(prev => prev.map(c => (c.id === catId ? { ...c, chapters: (c.chapters || []).filter((ch: any) => ch.id !== chapterId) } : c)));
  };

  // Audio item ops
  const addItem = async (catId: string, chapterId: string, data: { title: string; text: string; status: 'Published' | 'Draft' }) => {
    const res = await aiAudioService.createAudioItem({ categoryId: catId, chapterId, title: data.title, text: data.text, status: data.status, order: 1 } as any);
    if (res.success && res.data)
      setCategories(prev => prev.map(c => (c.id === catId ? { ...c, chapters: (c.chapters || []).map((ch: any) => (ch.id === chapterId ? { ...ch, audioItems: [...(ch.audioItems || []), res.data] } : ch)) } : c)));
  };
  const updateItem = async (catId: string, chapterId: string, itemId: string, updates: any) => {
    const res = await aiAudioService.updateAudioItem(itemId, updates);
    if (res.success && res.data)
      setCategories(prev => prev.map(c => (c.id === catId ? { ...c, chapters: (c.chapters || []).map((ch: any) => (ch.id === chapterId ? { ...ch, audioItems: (ch.audioItems || []).map((it: any) => (it.id === itemId ? res.data : it)) } : ch)) } : c)));
  };
  const deleteItem = async (catId: string, chapterId: string, itemId: string) => {
    const res = await aiAudioService.deleteAudioItem(itemId);
    if (res.success)
      setCategories(prev => prev.map(c => (c.id === catId ? { ...c, chapters: (c.chapters || []).map((ch: any) => (ch.id === chapterId ? { ...ch, audioItems: (ch.audioItems || []).filter((it: any) => it.id !== itemId) } : ch)) } : c)));
  };
  const uploadItemAudio = async (catId: string, chapterId: string, item: any, file: File) => {
    const up = await uploadService.uploadAudio(file, `ai-audio/${item.id}`);
    if (up.success && up.url) await updateItem(catId, chapterId, item.id, { audioUrl: up.url, audioFile: file.name });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">AI Audio</h1>
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>

      {/* Add Category */}
      <InlineAddCategory onAdd={addCategory} />

      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : categories.length === 0 ? (
        <div className="text-gray-500">No categories</div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => (
            <Card key={cat.id} className="border">
              <CardHeader className="p-4">
                <div className="flex items-center gap-3">
                  <Input
                    value={cat.name}
                    onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                    className="max-w-sm"
                  />
                  <Select value={cat.status || 'Draft'} onValueChange={(v: any) => updateCategory(cat.id, { status: v })}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Published">Published</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => deleteCategory(cat.id)} className="text-red-600 border-red-200">
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
                <div className="mt-2">
                  <Textarea
                    value={cat.description || ''}
                    onChange={(e) => updateCategory(cat.id, { description: e.target.value })}
                    placeholder="Description"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <InlineAddChapter onAdd={(d) => addChapter(cat.id, d)} />

                {(cat.chapters || []).map((ch: any) => (
                  <div key={ch.id} className="rounded-md border p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={ch.title}
                        onChange={(e) => updateChapter(cat.id, ch.id, { title: e.target.value })}
                        className="max-w-sm"
                      />
                      <Button variant="outline" onClick={() => deleteChapter(cat.id, ch.id)} className="text-red-600 border-red-200">
                        <Trash2 className="h-4 w-4 mr-1" /> Delete Chapter
                      </Button>
                    </div>
                    <Textarea
                      value={ch.description || ''}
                      onChange={(e) => updateChapter(cat.id, ch.id, { description: e.target.value })}
                      placeholder="Chapter description"
                    />

                    {/* Add audio item */}
                    <InlineAddItem onAdd={(d) => addItem(cat.id, ch.id, d)} />

                    <div className="space-y-3">
                      {(ch.audioItems || []).map((it: any) => (
                        <div key={it.id} className="rounded border p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={it.title}
                              onChange={(e) => updateItem(cat.id, ch.id, it.id, { title: e.target.value })}
                              className="max-w-md"
                            />
                            <Select value={it.status || 'Draft'} onValueChange={(v: any) => updateItem(cat.id, ch.id, it.id, { status: v })}>
                              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Published">Published</SelectItem>
                                <SelectItem value="Draft">Draft</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={() => deleteItem(cat.id, ch.id, it.id)} className="text-red-600 border-red-200">
                              <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                          </div>

                          <Textarea
                            value={it.text || ''}
                            onChange={(e) => updateItem(cat.id, ch.id, it.id, { text: e.target.value })}
                            placeholder="Text / Script"
                          />

                          <div className="flex items-center gap-3">
                            {it.audioUrl ? (
                              <audio controls src={it.audioUrl} className="w-full" />
                            ) : (
                              <Badge className="bg-gray-100 text-gray-600">No audio</Badge>
                            )}
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                              <Upload className="h-4 w-4" />
                              <span className="text-sm">Upload</span>
                              <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadItemAudio(cat.id, ch.id, it, file);
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function InlineAddCategory({ onAdd }: { onAdd: (d: { name: string; description: string; status: 'Published' | 'Draft' }) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Published' | 'Draft'>('Draft');
  return (
    <div className="rounded-md border p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} className="max-w-sm" />
        <Select value={status} onValueChange={(v: any) => setStatus(v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Published">Published</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            if (!name.trim()) return;
            onAdd({ name: name.trim(), description: description.trim(), status });
            setName('');
            setDescription('');
            setStatus('Draft');
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>
      <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
    </div>
  );
}

function InlineAddChapter({ onAdd }: { onAdd: (d: { title: string; description: string }) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  return (
    <div className="rounded-md border p-3 flex items-center gap-2">
      <Input placeholder="Chapter title" value={title} onChange={(e) => setTitle(e.target.value)} className="max-w-sm" />
      <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="flex-1" />
      <Button
        onClick={() => {
          if (!title.trim()) return;
          onAdd({ title: title.trim(), description: description.trim() });
          setTitle('');
          setDescription('');
        }}
        className="gap-2"
      >
        <Plus className="h-4 w-4" /> Add Chapter
      </Button>
    </div>
  );
}

function InlineAddItem({ onAdd }: { onAdd: (d: { title: string; text: string; status: 'Published' | 'Draft' }) => void }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'Published' | 'Draft'>('Draft');
  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Input placeholder="Audio item title" value={title} onChange={(e) => setTitle(e.target.value)} className="max-w-sm" />
        <Select value={status} onValueChange={(v: any) => setStatus(v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Published">Published</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            if (!title.trim() || !text.trim()) return;
            onAdd({ title: title.trim(), text: text.trim(), status });
            setTitle('');
            setText('');
            setStatus('Draft');
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Add Audio Item
        </Button>
      </div>
      <Textarea placeholder="Text / Script" value={text} onChange={(e) => setText(e.target.value)} />
    </div>
  );
}
