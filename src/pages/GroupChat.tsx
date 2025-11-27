import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";

const GroupChat = () => {
  const [messages, setMessages] = useState<Array<{ id: number; user: string; text: string }>>([
    { id: 1, user: "Alex", text: "Running late, will update my ETA soon" },
    { id: 2, user: "Sarah", text: "No worries! We can wait a bit." },
  ]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { id: Date.now(), user: "You", text: text.trim() }]);
    setText("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Group Chat</h2>
        <Card className="p-4 mb-4 h-96 overflow-y-auto">
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`p-3 rounded-lg ${m.user === 'You' ? 'bg-primary/10 ml-auto max-w-[80%]' : 'bg-card/50'}`}>
                <div className="text-sm font-medium">{m.user}</div>
                <div className="text-sm text-muted-foreground">{m.text}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </Card>

          <div className="flex gap-3">
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." />
            <Button onClick={send}>Send</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;
