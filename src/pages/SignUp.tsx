
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowRight, Mail, Lock, User, Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { loadCaptchaEnginge, LoadCanvasTemplate, validateCaptcha } from "react-simple-captcha";

const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  captcha: z.string().min(1, { message: "Please enter the captcha code" }),
});

type SignUpValues = z.infer<typeof signUpSchema>;

const SignUp = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [profileType, setProfileType] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userData, setUserData] = useLocalStorage("userData", null);
  const [captchaError, setCaptchaError] = useState("");
  
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      captcha: "",
    },
  });

  useEffect(() => {
    // Load the captcha engine when the component mounts
    loadCaptchaEnginge(6);
  }, []);

  const refreshCaptcha = () => {
    loadCaptchaEnginge(6);
    setCaptchaError("");
    form.setValue("captcha", "");
  };

  const onSubmit = (values: SignUpValues) => {
    // Validate the captcha
    if (!validateCaptcha(values.captcha)) {
      setCaptchaError("The captcha you entered is incorrect");
      return;
    }

    // Reset any captcha error
    setCaptchaError("");
    
    // In a real app, this would send the data to an API
    toast.success("Account created successfully!");
    
    // Store user data in local storage for demo purposes
    setUserData({
      ...values,
      profileType,
      profileImage,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      wishlists: [],
      following: [],
      followers: []
    });
    
    // Move to the next step of onboarding
    setStep(2);
  };

  const handleProfileTypeSelection = (type: string) => {
    setProfileType(type);
    // Move to the next step (profile customization)
    setStep(3);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const completeOnboarding = () => {
    // Update user data with final profile info
    setUserData(prevData => ({
      ...prevData,
      profileImage,
      profileType,
      onboardingCompleted: true
    }));
    
    toast.success("Profile set up successfully!");
    navigate("/dashboard");
  };

  return (
    <div className="container max-w-md mx-auto py-10 px-4">
      {step === 1 && (
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription>
              Join our community to find perfect gifts and share your wishlist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input placeholder="Your name" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input type="email" placeholder="your@email.com" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input type="password" placeholder="********" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Captcha Field */}
                <div className="space-y-2">
                  <div className="relative bg-gray-50 p-3 rounded-md border">
                    <LoadCanvasTemplate />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-3 right-3 h-8 w-8"
                      onClick={refreshCaptcha}
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span className="sr-only">Refresh Captcha</span>
                    </Button>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="captcha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Captcha</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter the code shown above" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {captchaError && (
                    <p className="text-sm font-medium text-destructive">{captchaError}</p>
                  )}
                </div>
                
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                  Create Account
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/sign-in" className="text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">What brings you here?</CardTitle>
            <CardDescription>
              Tell us how you plan to use our platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => handleProfileTypeSelection("gifter")}
              variant="outline" 
              className="w-full justify-between h-auto p-4 text-left"
            >
              <div>
                <div className="font-medium">I want to find gifts</div>
                <div className="text-sm text-muted-foreground">Browse and purchase gifts for friends and family</div>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Button>
            
            <Button 
              onClick={() => handleProfileTypeSelection("giftee")}
              variant="outline" 
              className="w-full justify-between h-auto p-4 text-left"
            >
              <div>
                <div className="font-medium">I want to create wishlists</div>
                <div className="text-sm text-muted-foreground">Share my gift preferences with others</div>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Button>
            
            <Button 
              onClick={() => handleProfileTypeSelection("both")}
              variant="outline" 
              className="w-full justify-between h-auto p-4 text-left"
            >
              <div>
                <div className="font-medium">Both!</div>
                <div className="text-sm text-muted-foreground">I want to find gifts and create wishlists</div>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Complete your profile</CardTitle>
            <CardDescription>
              Add a profile picture to personalize your account
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="relative group cursor-pointer">
              <Avatar className="h-24 w-24">
                {profileImage ? (
                  <AvatarImage src={profileImage} alt="Profile" />
                ) : (
                  <AvatarFallback className="bg-purple-100 text-purple-600 text-lg">
                    {form.getValues().name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <label htmlFor="profile-image" className="cursor-pointer">
                  <Camera className="h-6 w-6 text-white" />
                  <span className="sr-only">Upload profile image</span>
                </label>
              </div>
              <input
                id="profile-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            
            <div className="w-full space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                Your profile picture helps other users recognize you and makes your profile more inviting.
              </div>
              
              <Button 
                onClick={completeOnboarding}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Complete Setup
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={completeOnboarding}
              >
                Skip for now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SignUp;
