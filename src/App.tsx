import { createElement, useEffect, useState, type JSX } from "react";
// @ts-ignore
import "./index.css";
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import UserPage from "./pages/UserPage";
import AdminPage from "./pages/AdminPage";
import PostPage from "./pages/PostPage";
import { me as apiMe, logout as apiLogout, getToken, setToken } from "./lib/clientAuth";
import { apiFetch } from "@/lib/clientAuth";

function RequireAuth({ user, children }: { user: any | null | undefined; children: JSX.Element }) {
  if (user === undefined) return <div>Checking authentication…</div>;
  if (user === null) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ user, children }: { user: any | null | undefined; children: JSX.Element }) {
  if (user === undefined) return <div>Checking authentication…</div>;
  if (user === null) return <Navigate to="/login" replace />;
  if (!user?.is_admin) return <div className="max-w-md mx-auto p-4 text-destructive">Not authorized. Admins only.</div>;
  return children;
}

function Home({ user }: { user: any | null | undefined }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPost, setOpenPost] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    apiFetch("/api/posts").then(res => {
      if (res.ok) setPosts(res.data.posts);
      setLoading(false);
    });
  }, []);

  async function handleFavorite(postId: number) {
    await apiFetch(`/api/posts/${postId}/favorite`, { method: "POST" });
    alert("Added to favorites!");
  }

  async function handleDelete(postId: number) {
    if (!confirm("Delete this post?")) return;
    const res = await apiFetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (res.ok) setPosts(posts.filter(p => p.id !== postId));
  }

  async function openComments(post: any) {
    setOpenPost(post);
    const res = await apiFetch(`/api/posts/${post.id}/comments`);
    if (res.ok) setComments(res.data.comments);
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    const res = await apiFetch(`/api/posts/${openPost.id}/comments`, {
      method: "POST",
      body: JSON.stringify({ content: commentText }),
    });
    if (res.ok) {
      setComments([...comments, res.data.comment]);
      setCommentText("");
    }
  }

  if (loading) return <div>Loading posts...</div>;
  if (posts.length === 0) return <div>No posts yet.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Latest Posts</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map(post => (
          <div key={post.id} className="border rounded p-2 ">
            {post.image_url && <img src={post.image_url} className="w-auto h-32 object-cover rounded mb-2" />}
            <h2 className="font-bold text-sm">{post.title}</h2>
            <p className="text-sm text-gray-500 tx-sm">by {post.username}</p>
            <p className="mt-1">{post.description}</p>
            {post.price && <p className="mt-1 text-sm font-semibold">${post.price}</p>}
            <div className="flex gap-2 mt-2">
              <button onClick={() => openComments(post)} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm"> Comments</button>
              {user && <button onClick={() => handleFavorite(post.id)} className="px-2 py-1 rounded bg-yellow-100 hover:bg-yellow-200 text-sm"> Favorite</button>}
              {user?.id === post.user_id && <button onClick={() => handleDelete(post.id)} className="px-2 py-1 rounded bg-gray-300 hover:bg-red-600 text-sm"> Delete</button>}
            </div>
          </div>
        ))}
      </div>

      {/* Comments modal */}
      {openPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <h2 className="font-bold text-lg mb-3">Comments — {openPost.title}</h2>
            <div className="max-h-60 overflow-y-auto mb-3 grid gap-2">
              {comments.length === 0 && <p className="text-sm text-gray-500">No comments yet.</p>}
              {comments.map(c => (
                <div key={c.id} className="border rounded p-2 text-sm">{c.content}</div>
              ))}
            </div>
            {user && (
              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="border rounded px-2 py-1 text-sm flex-1"
                />
                <button onClick={handleAddComment} className="px-3 py-1 rounded bg-blue-400 hover:bg-blue-600 text-white text-sm">Send</button>
              </div>
            )}
            <button onClick={() => setOpenPost(null)} className="mt-3 text-sm text-gray-500 hover:underline">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}


export function App() {
  const [user, setUser] = useState<any | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) {
        setUser(null);
        return;
      }
      try {
        const res = await apiMe();
        if (res.ok) setUser(res.data?.user ?? null);
        else {
          setUser(null);
          localStorage.removeItem("token");
        }
      } catch (e) {
        setUser(null);
      }
    })();
  }, []);

  return (
    <BrowserRouter>
      <AppInner user={user} setUser={setUser} />
    </BrowserRouter>
  );
}

function AppInner({ user, setUser }: { user: any | null | undefined; setUser: (u: any) => void }) {
  const navigate = useNavigate();

  const handleAuth = (userData: any, token: string) => {
    try {
      setToken(token);
    } catch (e) { }
    setUser(userData);
    navigate("/user");
  };

  const handleLogout = () => {
    try {
      apiLogout();
      localStorage.removeItem("token");
    } catch (e) { }
    setUser(null);
    navigate("/");
  };

  return (
    <div className="p-4 ">
      <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <Link to="/" className="text-primary hover:underline">Home</Link>
        {user === null && (
          <>
            <span className="text-muted-foreground">|</span>
            <Link to="/register" className="text-primary hover:underline">Register</Link>
            <span className="text-muted-foreground">|</span>
            <Link to="/login" className="text-primary hover:underline">Login</Link>
          </>
        )}
        <span className="text-muted-foreground">|</span>
        <Link to="/user" className="hover:underline">User</Link>
        <span className="text-muted-foreground">|</span>
        <Link to="/admin" className="hover:underline">Admin</Link>
        {user && (
          <span className="ml-3 flex items-center gap-2 text-sm">
            <span>Logged in as <strong>{user.username}</strong></span>
            <button onClick={handleLogout} className="ml-1 px-2 py-1 rounded bg-gray-200 hover:bg-red-600 text-sm">Logout</button>
          </span>
        )}

        <Link to="/post"><button  className="ml-auto px-10 py-1 rounded bg-blue-400 hover:bg-blue-600 text-white">Post</button></Link>
      </nav>

      <hr />

      <div className="mt-3">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/register" element={user ? <Navigate to="/user" replace /> : <Register onAuth={handleAuth} />} />
          <Route path="/login" element={user ? <Navigate to="/user" replace /> : <Login onAuth={handleAuth} />} />
          <Route path="/post" element={
            <RequireAuth user={user}>
              {createElement(PostPage as any, { onAuth: handleAuth })}
            </RequireAuth>
          } />
          <Route path="/user" element={
            <RequireAuth user={user}>
              <UserPage user={user} onLogout={handleLogout} />
            </RequireAuth>
            
          } />
          <Route path="/admin" element={
            <RequireAuth user={user}>
              <RequireAdmin user={user}>
                <AdminPage user={user} onLogout={handleLogout} />
              </RequireAdmin>
            </RequireAuth>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
