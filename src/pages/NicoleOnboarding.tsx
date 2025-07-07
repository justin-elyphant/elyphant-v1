import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Upload, MessageSquare, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import GooglePlacesAutocomplete from '@/components/forms/GooglePlacesAutocomplete';
import { chatWithNicole, NicoleContext, NicoleMessage } from '@/services/ai/nicoleAiService';
import Logo from '@/components/home/components/Logo';

interface ProfileData {
  photo?: string;
  username: string;
  dateOfBirth?: Date;
  address: string;
}

type OnboardingStep = 'profile' | 'conversation';

const NicoleOnboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('profile');
  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  
  // Nicole conversation state
  const [messages, setMessages] = useState<NicoleMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [nicoleContext, setNicoleContext] = useState<NicoleContext>({});
  const [isTyping, setIsTyping] = useState(false);

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/signup');
    }
  }, [user, navigate]);

  // Initialize Nicole conversation
  useEffect(() => {
    if (step === 'conversation' && messages.length === 0) {
      const userName = profileData.username || user?.email?.split('@')[0] || 'there';
      const welcomeMessage: NicoleMessage = {
        role: 'assistant',
        content: `Hey ${userName}! 👋 Welcome to Elyphant! What brings you here today?`
      };
      setMessages([welcomeMessage]);
    }
  }, [step, profileData.username, user, messages.length]);

  const handleProfileSubmit = () => {
    if (!profileData.username.trim()) return;
    setStep('conversation');
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: NicoleMessage = {
      role: 'user',
      content: inputMessage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await chatWithNicole(inputMessage, nicoleContext, messages);
      
      const assistantMessage: NicoleMessage = {
        role: 'assistant',
        content: response.message
      };

      setMessages(prev => [...prev, assistantMessage]);
      setNicoleContext(response.context);

      // If Nicole is ready to help with marketplace/wishlists, redirect
      if (response.generateSearch || response.showSearchButton) {
        setTimeout(() => {
          navigate('/marketplace');
        }, 2000);
      }
    } catch (error) {
      console.error('Error chatting with Nicole:', error);
      const errorMessage: NicoleMessage = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Let me redirect you to our marketplace where you can explore!"
      };
      setMessages(prev => [...prev, errorMessage]);
      setTimeout(() => navigate('/marketplace'), 2000);
    } finally {
      setIsTyping(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({ ...prev, photo: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const userInitials = profileData.username
    ? profileData.username.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Simple Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="container mx-auto px-4 py-4">
          <Logo />
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          
          {step === 'profile' && (
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Let's get you set up! ✨
                  </h1>
                  <p className="text-gray-600">
                    Just a few quick details to personalize your experience
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Profile Photo */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={profileData.photo} />
                        <AvatarFallback className="bg-purple-100 text-purple-800 text-xl font-semibold">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <label className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full cursor-pointer hover:bg-purple-700 transition-colors">
                        <Upload className="h-4 w-4" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                    <p className="text-sm text-gray-500">Add a profile photo (optional)</p>
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username">What should we call you?</Label>
                    <Input
                      id="username"
                      placeholder="Your preferred name"
                      value={profileData.username}
                      onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                      className="text-center text-lg py-3"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label>When's your birthday? (helps with gift recommendations)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal py-3",
                            !profileData.dateOfBirth && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {profileData.dateOfBirth ? (
                            format(profileData.dateOfBirth, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={profileData.dateOfBirth}
                          onSelect={(date) => setProfileData(prev => ({ ...prev, dateOfBirth: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label>Where should we ship your gifts?</Label>
                    <GooglePlacesAutocomplete
                      value={profileData.address}
                      onChange={(value) => setProfileData(prev => ({ ...prev, address: value }))}
                      onAddressSelect={(address) => 
                        setProfileData(prev => ({ ...prev, address: address.formatted_address }))
                      }
                      placeholder="Enter your address"
                      className="py-3"
                    />
                  </div>

                  <Button 
                    onClick={handleProfileSubmit}
                    disabled={!profileData.username.trim()}
                    className="w-full py-3 text-lg bg-purple-600 hover:bg-purple-700"
                  >
                    Continue to Nicole <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'conversation' && (
            <div className="space-y-6">
              {/* Google/GPT Style Conversation */}
              <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                <CardContent className="p-0">
                  {/* Messages */}
                  <div className="space-y-4 p-6 min-h-[400px] max-h-[500px] overflow-y-auto">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex gap-3",
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {message.role === 'assistant' && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-purple-100 text-purple-800 text-sm">
                              N
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "max-w-[80%] rounded-xl px-4 py-3 text-sm",
                            message.role === 'user'
                              ? "bg-purple-600 text-white ml-auto"
                              : "bg-gray-100 text-gray-900"
                          )}
                        >
                          {message.content}
                        </div>
                        {message.role === 'user' && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={profileData.photo} />
                            <AvatarFallback className="bg-blue-100 text-blue-800 text-sm">
                              {userInitials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex gap-3 justify-start">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-purple-100 text-purple-800 text-sm">
                            N
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-100 rounded-xl px-4 py-3 text-sm">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="border-t border-gray-200/50 p-4">
                    <div className="flex gap-3">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 border-0 bg-gray-50 focus:bg-white"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={isTyping}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isTyping}
                        size="icon"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 text-left"
                  onClick={() => setInputMessage("I need to schedule a gift for someone")}
                >
                  <div>
                    <div className="font-medium">Schedule a Gift</div>
                    <div className="text-sm text-gray-500">Set up automated gifting</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto p-4 text-left"
                  onClick={() => setInputMessage("I want to create wishlists")}
                >
                  <div>
                    <div className="font-medium">Build Wishlists</div>
                    <div className="text-sm text-gray-500">Share what you love</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto p-4 text-left"
                  onClick={() => setInputMessage("I'm looking for gift ideas")}
                >
                  <div>
                    <div className="font-medium">Find Gifts</div>
                    <div className="text-sm text-gray-500">Discover perfect presents</div>
                  </div>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NicoleOnboarding;