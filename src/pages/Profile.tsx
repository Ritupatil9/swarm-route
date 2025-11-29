import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const TRAVEL_TYPES = [
  "Beach person",
  "Mountain person",
  "City explorer",
  "Adventurer",
  "Food traveler",
  "Road trip lover",
];

const TRAVEL_INTERESTS = [
  "Hiking",
  "Camping",
  "Luxury travel",
  "Backpacking",
  "Wildlife",
  "Photography",
  "Cultural exploration",
  "Water sports",
];

const Profile = () => {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    travelType: "",
    bio: "",
    favoriteDestinations: "",
    travelInterests: [] as string[],
    avatar: "🧑",
  });
  const [favList, setFavList] = useState<string[]>([]);
  const [newDest, setNewDest] = useState("");
  const [newInterest, setNewInterest] = useState("");

  useEffect(() => {
    if (profile) {
      setFormData({
        age: profile.age?.toString() || "",
        gender: profile.gender || "",
        travelType: profile.travelType || "",
        bio: profile.bio || "",
        favoriteDestinations: (profile.favoriteDestinations || []).join(", "),
        travelInterests: profile.travelInterests || [],
        avatar:
          profile.avatar ||
          (profile.gender === "Male"
            ? "👨"
            : profile.gender === "Female"
            ? "👩"
            : "🧑"),
      });
      setFavList(profile.favoriteDestinations || []);
    }
  }, [profile, isEditing]);

  if (!user) {
    navigate("/");
    return null;
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      travelInterests: prev.travelInterests.includes(interest)
        ? prev.travelInterests.filter((i) => i !== interest)
        : [...prev.travelInterests, interest],
    }));
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const destinations = (favList.length
        ? favList
        : formData.favoriteDestinations
            .split(",")
            .map((d) => d.trim())
            .filter((d) => d)
      ).map((d) => d.trim());

      const derivedAvatar =
        formData.avatar ||
        (formData.gender === "Male"
          ? "👨"
          : formData.gender === "Female"
          ? "👩"
          : "🧑");

      await updateProfile({
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender || undefined,
        travelType: formData.travelType || undefined,
        bio: formData.bio || undefined,
        favoriteDestinations: destinations,
        travelInterests: formData.travelInterests,
        avatar: derivedAvatar,
      });

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update profile";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Profile</h2>

          {/* User Info Card */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24 border shadow-sm bg-muted/40 overflow-hidden flex items-center justify-center">
                  {(() => {
                    const avatarVal = formData.avatar || profile?.avatar || user.photoURL || "";
                    const isUrl = /^(https?:\/\/|data:)/i.test(avatarVal);
                    if (isUrl) {
                      return (
                        <img
                          src={avatarVal}
                          alt="Profile avatar"
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      );
                    }
                    if (avatarVal) {
                      // Show provided emoji/text avatar directly
                      return (
                        <span className="text-4xl leading-none">
                          {avatarVal}
                        </span>
                      );
                    }
                    // Fallback: initials from displayName or user email
                    const initials = (user.displayName || user.email || "User")
                      .split(/\s+/)
                      .slice(0, 2)
                      .map(part => part.charAt(0).toUpperCase())
                      .join("");
                    return (
                      <span className="text-xl font-semibold text-foreground">
                        {initials}
                      </span>
                    );
                  })()}
                </Avatar>
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold">{user.displayName || "User"}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
                {profile?.createdAt && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Member since{" "}
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </div>
                )}
              </div>
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "destructive" : "default"}
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>
          </Card>

          {/* Alerts */}
          {error && (
            <div className="p-3 mb-4 bg-destructive/10 border border-destructive/30 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          {success && (
            <div className="p-3 mb-4 bg-green-500/10 border border-green-500/30 rounded-md">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Profile Details */}
          <div className="space-y-4">
            {/* Row 1: Age & Gender */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <label className="block text-sm font-medium mb-2">Age</label>
                {isEditing ? (
                  <Input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="Your age"
                    disabled={isSaving}
                  />
                ) : (
                  <p className="text-base text-foreground">
                    {formData.age || "Not specified"}
                  </p>
                )}
              </Card>

              <Card className="p-4">
                <label className="block text-sm font-medium mb-2">Gender</label>
                {isEditing ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="text-base text-foreground">
                    {formData.gender || "Not specified"}
                  </p>
                )}
              </Card>
            </div>

            {/* Row 2: Travel Type */}
            <Card className="p-4">
              <label className="block text-sm font-medium mb-2">Travel Type</label>
              {isEditing ? (
                <select
                  name="travelType"
                  value={formData.travelType}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="">Select travel type</option>
                  {TRAVEL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-base text-foreground">
                  {formData.travelType || "Not specified"}
                </p>
              )}
            </Card>

            {/* Row 3: Bio */}
            <Card className="p-4">
              <label className="block text-sm font-medium mb-2">Personal Bio</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  disabled={isSaving}
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm resize-none"
                />
              ) : (
                <p className="text-base text-foreground">
                  {formData.bio || "Not specified"}
                </p>
              )}
            </Card>

            {/* Row 4: Favorite Destinations */}
            <Card className="p-4">
              <label className="block text-sm font-medium mb-2">
                Favorite Destinations
              </label>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {(favList.length ? favList : (formData.favoriteDestinations || "").split(",").map(d=>d.trim()).filter(Boolean)).map((dest, idx) => (
                      <button
                        type="button"
                        key={`${dest}-${idx}`}
                        onClick={() => setFavList((prev)=> prev.filter((d)=> d !== dest))}
                        className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm flex items-center gap-2 hover:bg-primary/15"
                        disabled={isSaving}
                        title="Remove"
                      >
                        {dest}
                        <span className="inline-block w-4 h-4 rounded-sm bg-primary/20 text-primary text-xs">×</span>
                      </button>
                    ))}
                    {favList.length === 0 && !formData.favoriteDestinations && (
                      <span className="text-sm text-muted-foreground">Add places you love visiting</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newDest}
                      onChange={(e)=> setNewDest(e.target.value)}
                      placeholder="Add destination"
                      disabled={isSaving}
                    />
                    <Button
                      type="button"
                      onClick={()=>{
                        const v = newDest.trim();
                        if (!v) return;
                        setFavList((prev)=> Array.from(new Set([...prev, v])));
                        setNewDest("");
                      }}
                      disabled={isSaving}
                    >Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Mumbai","Pune","Mahabaleshwar","Goa","Satara"].map((s)=> (
                      <button key={s} type="button" className="px-2 py-1 rounded border hover:bg-muted" onClick={()=> setFavList((prev)=> Array.from(new Set([...prev, s])))} disabled={isSaving}>{s}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.favoriteDestinations ? (
                    formData.favoriteDestinations
                      .split(",")
                      .map((dest, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                        >
                          {dest.trim()}
                        </span>
                      ))
                  ) : (
                    <p className="text-base text-muted-foreground">
                      Not specified
                    </p>
                  )}
                </div>
              )}
            </Card>

            {/* Row 5: Travel Interests */}
            <Card className="p-4">
              <label className="block text-sm font-medium mb-3">
                Travel Interests
              </label>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-2">
                  {TRAVEL_INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      disabled={isSaving}
                      className={`p-2 rounded-md text-xs font-medium transition-all ${
                        formData.travelInterests.includes(interest)
                          ? "bg-primary text-white"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                  <div className="col-span-2 flex gap-2 mt-2">
                    <Input
                      value={newInterest}
                      onChange={(e)=> setNewInterest(e.target.value)}
                      placeholder="Add custom interest"
                      disabled={isSaving}
                    />
                    <Button type="button" onClick={()=>{
                      const v = newInterest.trim();
                      if (!v) return;
                      setFormData((prev)=> ({...prev, travelInterests: Array.from(new Set([...prev.travelInterests, v])) }));
                      setNewInterest("");
                    }} disabled={isSaving}>Add</Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.travelInterests.length > 0 ? (
                    formData.travelInterests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-primary text-white rounded-full text-sm font-medium"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-base text-muted-foreground">
                      Not specified
                    </p>
                  )}
                </div>
              )}
            </Card>

            {/* Row 6: Map Avatar */}
            <Card className="p-4">
              <label className="block text-sm font-medium mb-3">
                Map Avatar (person icon shown on the map)
              </label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    name="avatar"
                    value={formData.avatar}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, avatar: e.target.value.slice(0, 2) }))
                    }
                    className="w-24 text-center text-2xl"
                    disabled={isSaving}
                  />
                  <div className="flex flex-wrap gap-1">
                    {["👨", "👩", "🧑", "👨‍🦱", "👩‍🦱", "👨‍🎓", "👩‍🎓"].map((emo) => (
                      <button
                        key={emo}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            avatar: emo,
                          }))
                        }
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-lg border ${
                          formData.avatar === emo ? "bg-primary text-white" : "bg-muted"
                        }`}
                        disabled={isSaving}
                      >
                        {emo}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-base text-foreground text-2xl">
                  {formData.avatar || "🧑"}
                </p>
              )}
            </Card>

            {/* Save Button */}
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="w-full"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
