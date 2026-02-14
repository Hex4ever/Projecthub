import { Layout } from "@/components/Layout";
import { useRoute } from "wouter";
import { usePage, useUpdatePage } from "@/hooks/use-pages";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-mobile"; // Reusing existing if compatible or mocking standard debounce
import { Link } from "wouter";

// Debounce helper since the hook might not exist exactly as needed
function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>();

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => {
      callback(...args);
    }, delay);
    setTimeoutId(id);
  };
}

export default function PageEditor() {
  const [match, params] = useRoute("/pages/:id");
  const pageId = parseInt(params!.id);
  const { data: page, isLoading } = usePage(pageId);
  const updatePage = useUpdatePage();
  const [title, setTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");

  const debouncedUpdate = useDebouncedCallback((newContent: any, newTitle: string) => {
    setSaveStatus("saving");
    updatePage.mutate(
      { id: pageId, content: newContent, title: newTitle },
      {
        onSuccess: () => setSaveStatus("saved"),
        onError: () => setSaveStatus("error")
      }
    );
  }, 1000);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write something amazing... (or type your meeting notes)",
      }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none max-w-none",
      },
    },
    onUpdate: ({ editor }) => {
      setSaveStatus("saving");
      debouncedUpdate(editor.getJSON(), title);
    },
  });

  // Sync initial data
  useEffect(() => {
    if (page) {
      setTitle(page.title);
      if (editor && !editor.getText() && page.content) {
        // Only set content if editor is empty to prevent cursor jumping on re-renders
        // Ideally we'd compare content, but for MVP this ensures loading works
        try {
           // Type assertion needed because page.content is jsonb (unknown)
           editor.commands.setContent(page.content as any);
        } catch (e) {
          console.error("Failed to set content", e);
        }
      }
    }
  }, [page, editor]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedUpdate(editor?.getJSON(), newTitle);
  };

  if (isLoading || !editor) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!page) return <div>Page not found</div>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-20">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/projects/${page.projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="text-sm text-muted-foreground">
            {saveStatus === "saving" ? (
              <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Saving...</span>
            ) : (
              <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3 w-3"/> Saved</span>
            )}
          </div>
        </div>

        <Input 
          value={title}
          onChange={handleTitleChange}
          className="text-4xl font-bold border-none shadow-none px-0 focus-visible:ring-0 h-auto py-2 mb-4 placeholder:text-muted-foreground/50"
          placeholder="Untitled Page"
        />
        
        <div className="min-h-[500px] border rounded-lg bg-card shadow-sm p-8 md:p-12">
           <EditorContent editor={editor} />
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-sm text-blue-700 dark:text-blue-300">
          <strong>Pro Tip:</strong> We're working on "Select to create task". In the next update, you'll be able to highlight text and instantly turn it into a trackable task!
        </div>
      </div>
    </Layout>
  );
}
