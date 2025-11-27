import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

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
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        age: profile.age?.toString() || "",
        gender: profile.gender || "",
        travelType: profile.travelType || "",
        bio: profile.bio || "",
        favoriteDestinations: (profile.favoriteDestinations || []).join(", "),
        travelInterests: profile.travelInterests || [],
      });
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
      const destinations = formData.favoriteDestinations
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d);

      await updateProfile({
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender || undefined,
        travelType: formData.travelType || undefined,
        bio: formData.bio || undefined,
        favoriteDestinations: destinations,
        travelInterests: formData.travelInterests,
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
              <Avatar className="w-20 h-20 bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold">
                {user.displayName?.charAt(0) || "U"}
              </Avatar>
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
                <Input
                  name="favoriteDestinations"
                  value={formData.favoriteDestinations}
                  onChange={handleInputChange}
                  placeholder="e.g., Paris, Tokyo, New York (comma-separated)"
                  disabled={isSaving}
                />
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
