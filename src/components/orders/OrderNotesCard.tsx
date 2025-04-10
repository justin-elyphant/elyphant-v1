
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare, User, Calendar } from "lucide-react";

interface OrderNote {
  id: string;
  authorName: string;
  content: string;
  timestamp: string;
}

interface OrderNotesCardProps {
  orderId: string;
}

const OrderNotesCard = ({ orderId }: OrderNotesCardProps) => {
  const [newNote, setNewNote] = useState("");
  const [notes, setNotes] = useState<OrderNote[]>([]);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    const note: OrderNote = {
      id: `note_${Date.now()}`,
      authorName: "Support Agent",
      content: newNote,
      timestamp: new Date().toISOString(),
    };
    
    setNotes([...notes, note]);
    setNewNote("");
    
    toast.success("Note added", {
      description: "Internal note added to order",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Internal Notes</CardTitle>
        <CardDescription>
          These notes are only visible to Elyphant staff
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notes.length > 0 ? (
            <div className="space-y-3 mb-4">
              {notes.map((note) => (
                <div key={note.id} className="p-3 bg-muted rounded-md">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4" />
                      {note.authorName}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(note.timestamp)}
                    </div>
                  </div>
                  <p className="text-sm">{note.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notes for this order yet.</p>
            </div>
          )}

          <div className="space-y-3">
            <Textarea
              placeholder="Add an internal note about this order..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                Add Note
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderNotesCard;
