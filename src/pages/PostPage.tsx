import { apiFetch } from "@/lib/clientAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";

export  function CreatePost(){

const[title, setTitle] = useState("")
const[description, setDescription] = useState("")
const[price, setPrice] = useState("0")
const[image_url, setImage_url] = useState("")
 const [error, setError] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);

async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

try{
    const res = await apiFetch("/api/posts", {
  method: "POST",
  body: JSON.stringify({ title, description, price: Number(price), image_url, category_id: null }),
});
if (!res.ok) throw new Error(res.data?.error);
console.log(res.data.post);
setTitle("");
setDescription("");
setPrice("0");
setImage_url("");
}
catch (err) {
    setError("Failed to create post.");
}
setLoading(false);
}
 
return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Post</h1>
      <form  onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-1">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)}/>
        </div>
    
    
        <div className="grid gap-4">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)}/>
        </div>

        <div className="grid gap-4">
            <Label htmlFor="price">Price</Label>
            <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)}/>
        </div>
            <div className="grid gap-4">
            <Label htmlFor="image_url">Image URL</Label>
            <Input id="image_url" value={image_url} onChange={(e) => setImage_url(e.target.value)}/>
        </div>
        <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Post"}
        </Button>
        {error&&(
            <p className="text-red-500">{error}</p>
        )}
        </form>
    </div>

);
}   

    
    

    
   
    

export default CreatePost; 