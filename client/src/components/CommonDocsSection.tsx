import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCommonDocs, useCreateCommonDoc } from "@/hooks/use-common-docs";
import { formatDistanceToNow, format, isToday, isYesterday, startOfDay } from "date-fns";
import { MessageSquare, Send, Tag, Loader2, CheckCircle2, ChevronDown, Calendar, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTasks } from "@/hooks/use-tasks";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function CommonDocsSection() {
  const { data: docs, isLoading } = useCommonDocs();
  const createDoc = useCreateCommonDoc();
  const { data: tasks } = useTasks();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (date: string) => {
    setOpenSections(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const tags = tagsInput
      .split(/[\s,]+/)
      .filter(t => t.length > 0);

    const cleanedTags = tags.map(t => t.trim());

    await createDoc.mutateAsync({
      title,
      content,
      tags: cleanedTags
    });

    setTitle("");
    setContent("");
    setTagsInput("");
    setIsExpanded(false);
  };

  // Filter and Group docs by date
  const groupedDocs = useMemo(() => {
    if (!docs) return [];
    
    const filteredDocs = docs.filter(doc => {
      const search = searchQuery.toLowerCase();
      return (
        doc.title.toLowerCase().includes(search) ||
        doc.content.toLowerCase().includes(search) ||
        doc.tags.some(tag => tag.toLowerCase().includes(search)) ||
        `${doc.author.firstName} ${doc.author.lastName}`.toLowerCase().includes(search)
      );
    });

    const groups: Record<string, typeof docs> = {};
    
    filteredDocs.forEach(doc => {
      const date = startOfDay(new Date(doc.createdAt!)).toISOString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(doc);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, items]) => {
        const dateObj = new Date(date);
        let label = format(dateObj, "MMMM d, yyyy");
        if (isToday(dateObj)) label = "Today";
        else if (isYesterday(dateObj)) label = "Yesterday";
        
        return { date, label, items };
      });
  }, [docs, searchQuery]);

  // Default first section (Today) to open when loading or searching
  useMemo(() => {
    if (groupedDocs.length > 0 && Object.keys(openSections).length === 0) {
      setOpenSections({ [groupedDocs[0].date]: true });
    }
    // Auto-expand sections when searching
    if (searchQuery && groupedDocs.length > 0) {
      const allOpen = groupedDocs.reduce((acc, group) => ({ ...acc, [group.date]: true }), {});
      setOpenSections(allOpen);
    }
  }, [groupedDocs, searchQuery]);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-sm bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Record Team Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Topic or project update..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              className="bg-background border-primary/10"
            />
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <Textarea
                    placeholder="Use @Guild Name, @Title Name for categorization. Use @Name to assign.&#10;Add subtasks with: - [ ] subtask description @Assignee"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[120px] bg-background border-primary/10"
                  />
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground ml-1">
                        <Tag className="h-3 w-3" />
                        Tags (e.g. @Praveen, production)
                      </div>
                      <Input
                        placeholder="@name, urgent, follow-up"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        className="bg-background border-primary/10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={createDoc.isPending || !title || !content}>
                        {createDoc.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                        Post to Feed
                      </Button>
                      <Button variant="ghost" type="button" onClick={() => setIsExpanded(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search feed by title, content, tags, or author..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-background/50"
        />
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
          </div>
        ) : (
          groupedDocs.map((group) => (
            <Collapsible
              key={group.date}
              open={openSections[group.date]}
              onOpenChange={() => toggleSection(group.date)}
              className="space-y-2"
            >
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full flex items-center justify-between p-2 h-auto hover:bg-muted/50 group"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{group.label}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
                      {group.items.length}
                    </Badge>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openSections[group.date] ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
                {group.items.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="hover:border-primary/20 transition-colors shadow-sm">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border">
                              <AvatarImage src={doc.author.profileImageUrl || undefined} />
                              <AvatarFallback>{doc.author.firstName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold">
                                {doc.author.firstName} {doc.author.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(doc.createdAt!), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                            {doc.tags.map((tag, i) => (
                              <Badge key={i} variant={tag.startsWith('@') ? "default" : "secondary"} className="text-[10px] px-1.5 h-4">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-bold text-lg">{doc.title}</h3>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {doc.content}
                          </p>
                        </div>
                        
                        {doc.tags.some(t => t.startsWith('@')) && (
                          <div className="mt-4 pt-4 border-t flex items-center gap-2 text-xs text-primary font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Automatic tasks created for tagged members
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
        
        {groupedDocs.length === 0 && !isLoading && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
            <p className="text-muted-foreground">
              {searchQuery ? "No matches found for your search." : "The team feed is empty. Start by sharing a note!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
