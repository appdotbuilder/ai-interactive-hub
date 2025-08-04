
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { MessageSquare, Upload, Search, Brain, Bot, User, FileImage, FileVideo, Clock, Sparkles, Zap, Target } from 'lucide-react';
import type { 
  Conversation, 
  Message, 
  AIModel, 
  MediaFile, 
  SearchQuery,
  CreateConversationInput,
  SendMessageInput,
  UploadMediaInput,
  ProcessMediaInput,
  SearchInput,
  ThinkInput
} from '../../server/src/schema';

// Current user would come from authentication context in production
const CURRENT_USER = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com'
};

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiModels, setAiModels] = useState<AIModel[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchQuery[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  // Chat form state
  const [newMessage, setNewMessage] = useState('');
  const [newConversationTitle, setNewConversationTitle] = useState('');

  // Media form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [mediaProcessingType, setMediaProcessingType] = useState('');

  // Search form state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'advanced' | 'extended'>('advanced');

  // Think form state
  const [thinkQuery, setThinkQuery] = useState('');
  const [showReasoning, setShowReasoning] = useState(true);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const [conversationsData, modelsData, mediaData, searchData] = await Promise.all([
        trpc.getConversations.query(CURRENT_USER.id),
        trpc.getAIModels.query(),
        trpc.getMediaFiles.query(CURRENT_USER.id),
        trpc.getSearchHistory.query(CURRENT_USER.id)
      ]);

      setConversations(conversationsData);
      setAiModels(modelsData);
      setMediaFiles(mediaData);
      setSearchHistory(searchData);

      // Set default model if available
      if (modelsData.length > 0 && !selectedModel) {
        setSelectedModel(modelsData[0].name);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, [selectedModel]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load messages when conversation changes
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const messagesData = await trpc.getMessages.query(conversationId);
      setMessages(messagesData);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, []);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation, loadMessages]);

  // Create new conversation
  const handleCreateConversation = async () => {
    if (!newConversationTitle.trim() || !selectedModel) return;

    setIsLoading(true);
    try {
      const conversationData: CreateConversationInput = {
        user_id: CURRENT_USER.id,
        title: newConversationTitle,
        model_name: selectedModel
      };

      const newConversation = await trpc.createConversation.mutate(conversationData);
      setConversations((prev: Conversation[]) => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      setNewConversationTitle('');
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConversation || !selectedModel) return;

    setIsLoading(true);
    try {
      const messageData: SendMessageInput = {
        conversation_id: currentConversation.id,
        content: newMessage,
        model_name: selectedModel
      };

      await trpc.sendMessage.mutate(messageData);
      
      // Reload messages to get both user and AI responses
      await loadMessages(currentConversation.id);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setIsLoading(true);

    try {
      const uploadData: UploadMediaInput = {
        user_id: CURRENT_USER.id,
        filename: `${Date.now()}-${file.name}`,
        original_filename: file.name,
        file_type: file.type.startsWith('image/') ? 'image' : 'video',
        file_size: file.size,
        file_path: `/uploads/${Date.now()}-${file.name}` // This would be set by actual upload logic
      };

      const uploadedFile = await trpc.uploadMedia.mutate(uploadData);
      setMediaFiles((prev: MediaFile[]) => [uploadedFile, ...prev]);
      setUploadFile(null);
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Process media
  const handleProcessMedia = async (mediaId: string) => {
    if (!mediaProcessingType || !selectedModel) return;

    setIsLoading(true);
    try {
      const processData: ProcessMediaInput = {
        media_id: mediaId,
        processing_type: mediaProcessingType,
        model_name: selectedModel
      };

      await trpc.processMedia.mutate(processData);
      
      // Reload media files to get updated status
      const updatedMedia = await trpc.getMediaFiles.query(CURRENT_USER.id);
      setMediaFiles(updatedMedia);
    } catch (error) {
      console.error('Failed to process media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const searchData: SearchInput = {
        user_id: CURRENT_USER.id,
        query: searchQuery,
        search_type: searchType
      };

      const searchResult = await trpc.searchInternet.mutate(searchData);
      setSearchHistory((prev: SearchQuery[]) => [searchResult, ...prev]);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to search:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle AI think
  const handleAiThink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thinkQuery.trim() || !selectedModel) return;

    setIsLoading(true);
    try {
      const thinkData: ThinkInput = {
        query: thinkQuery,
        model_name: selectedModel,
        show_reasoning: showReasoning
      };

      await trpc.aiThink.mutate(thinkData);
      setThinkQuery('');
      // The result would typically be displayed in a dedicated area
    } catch (error) {
      console.error('Failed to process AI think:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI Assistant Hub ✨
              </h1>
              <p className="text-gray-600">Your intelligent companion for chat, media, and research</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Choose AI Model" />
              </SelectTrigger>
              <SelectContent>
                {aiModels.map((model: AIModel) => (
                  <SelectItem key={model.id} value={model.name}>
                    <div className="flex flex-col">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs text-gray-500">
                        {model.provider} • Context: {model.context_length.toLocaleString()}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Avatar>
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                {CURRENT_USER.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit">
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>AI Chat 💬</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Media AI 🎨</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Deep Search 🔍</span>
            </TabsTrigger>
            <TabsTrigger value="think" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>AI Think 🧠</span>
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Conversations Sidebar */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5" />
                      <span>Conversations</span>
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="New chat title..."
                        value={newConversationTitle}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          setNewConversationTitle(e.target.value)
                        }
                        className="text-sm"
                      />
                      <Button 
                        onClick={handleCreateConversation}
                        disabled={!newConversationTitle.trim() || isLoading}
                        size="sm"
                      >
                        ➕
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2">
                    <ScrollArea className="h-96">
                      {conversations.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                          No conversations yet 💭<br />
                          Create your first chat!
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {conversations.map((conv: Conversation) => (
                            <Button
                              key={conv.id}
                              variant={currentConversation?.id === conv.id ? "default" : "ghost"}
                              className="w-full justify-start text-left h-auto p-3"
                              onClick={() => setCurrentConversation(conv)}
                            >
                              <div className="truncate">
                                <div className="font-medium truncate">{conv.title}</div>
                                <div className="text-xs text-gray-500">{conv.model_name}</div>
                                <div className="text-xs text-gray-400">
                                  {conv.created_at.toLocaleDateString()}
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Chat Area */}
              <div className="lg:col-span-3">
                <Card className="h-[600px] flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>
                        {currentConversation ? (
                          <>🤖 {currentConversation.title}</>
                        ) : (
                          <>Select or create a conversation</>
                        )}
                      </span>
                      {currentConversation && (
                        <Badge variant="secondary" className="text-xs">
                          {currentConversation.model_name}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col p-4">
                    {!currentConversation ? (
                      <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                          <p>Choose a conversation or create a new one to start chatting! 🚀</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <ScrollArea className="flex-1 pr-4">
                          {messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-500">
                              <p>Start the conversation! 💫</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {messages.map((message: Message) => (
                                <div
                                  key={message.id}
                                  className={`flex ${
                                    message.role === 'user' ? 'justify-end' : 'justify-start'
                                  }`}
                                >
                                  <div
                                    className={`flex items-start space-x-3 max-w-[80%] ${
                                      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                                    }`}
                                  >
                                    <Avatar className="w-8 h-8">
                                      <AvatarFallback
                                        className={
                                          message.role === 'user'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-purple-500 text-white'
                                        }
                                      >
                                        {message.role === 'user' ? (
                                          <User className="w-4 h-4" />
                                        ) : (
                                          <Bot className="w-4 h-4" />
                                        )}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div
                                      className={`rounded-lg p-3 ${
                                        message.role === 'user'
                                          ? 'bg-blue-500 text-white'
                                          : 'bg-gray-100 text-gray-900'
                                      }`}
                                    >
                                      <p className="whitespace-pre-wrap">{message.content}</p>
                                      <p className="text-xs opacity-70 mt-1">
                                        {message.created_at.toLocaleTimeString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>

                        <Separator className="my-4" />

                        <form onSubmit={handleSendMessage} className="flex space-x-2">
                          <Textarea
                            placeholder="Type your message... ✍️"
                            value={newMessage}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                              setNewMessage(e.target.value)
                            }
                            className="flex-1 min-h-[60px] resize-none"
                            onKeyDown={(e: React.KeyboardEvent) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e as React.FormEvent);
                              }
                            }}
                          />
                          <Button 
                            type="submit" 
                            disabled={!newMessage.trim() || isLoading}
                            className="px-6"
                          >
                            {isLoading ? '🔄' : '🚀'}
                          </Button>
                        </form>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="w-5 h-5" />
                    <span>Upload & Process Media 🎨</span>
                  </CardTitle>
                  <CardDescription>
                    Upload images or videos for AI-powered analysis and enhancement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      disabled={isLoading}
                    />
                    {uploadFile && (
                      <p className="text-sm text-gray-600 mt-2">
                        📁 Selected: {uploadFile.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Processing Type</label>
                    <Select value={mediaProcessingType} onValueChange={setMediaProcessingType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose processing type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="analysis">🔍 Analysis</SelectItem>
                        <SelectItem value="enhancement">✨ Enhancement</SelectItem>
                        <SelectItem value="description">📝 Description</SelectItem>
                        <SelectItem value="extraction">📊 Content Extraction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isLoading && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        <span className="text-sm">Processing...</span>
                      </div>
                      <Progress value={45} className="w-full" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Media Files List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileImage className="w-5 h-5" />
                    <span>Your Media Files 📚</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    {mediaFiles.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <FileImage className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p>No media files yet 📷<br />Upload your first file!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {mediaFiles.map((file: MediaFile) => (
                          <div key={file.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {file.file_type === 'image' ? (
                                  <FileImage className="w-5 h-5 text-blue-500" />
                                ) : (
                                  <FileVideo className="w-5 h-5 text-purple-500" />
                                )}
                                <span className="font-medium truncate">
                                  {file.original_filename}
                                </span>
                              </div>
                              <Badge className={getStatusColor(file.processing_status)}>
                                {file.processing_status}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>📊 Size: {(file.file_size / 1024 / 1024).toFixed(2)} MB</p>
                              <p>📅 {file.created_at.toLocaleDateString()}</p>
                            </div>

                            {file.processing_status === 'pending' && (
                              <Button
                                size="sm"
                                className="mt-2"
                                onClick={() => handleProcessMedia(file.id)}
                                disabled={!mediaProcessingType || isLoading}
                              >
                                Process 🚀
                              </Button>
                            )}

                            {file.processing_result && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                <p className="text-sm">
                                  ✨ Processing completed! Results available.
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Search Form */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Search className="w-5 h-5" />
                      <span>Deep Search 🔍</span>
                    </CardTitle>
                    <CardDescription>
                      Advanced internet search with AI reasoning
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSearch} className="space-y-4">
                      <Textarea
                        placeholder="Enter your search query... 🔍"
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                          setSearchQuery(e.target.value)
                        }
                        className="min-h-[100px]"
                      />

                      <div>
                        <label className="block text-sm font-medium mb-2">Search Mode</label>
                        <Select value={searchType} onValueChange={(value) => setSearchType(value as 'advanced' | 'extended')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="advanced">
                              <div className="flex items-center space-x-2">
                                <Target className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">🎯 Advanced Search</div>
                                  <div className="text-xs text-gray-500">Direct & accurate</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="extended">
                              <div className="flex items-center space-x-2">
                                <Zap className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">⚡ Extended Search</div>
                                  <div className="text-xs text-gray-500">Comprehensive analysis</div>
                                </div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button 
                        type="submit" 
                        disabled={!searchQuery.trim() || isLoading}
                        className="w-full"
                      >
                        {isLoading ? '🔄 Searching...' : '🚀 Search'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Search Results */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="w-5 h-5" />
                      <span>Search History 📚</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      {searchHistory.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
                          <p>No searches yet 🔍<br />Try your first search!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {searchHistory.map((search: SearchQuery) => (
                            <div key={search.id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h3 className="font-medium">{search.query}</h3>
                                  <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500">
                                    <Badge variant={search.search_type === 'advanced' ? 'default' : 'secondary'}>
                                      {search.search_type === 'advanced' ? '🎯 Advanced' : '⚡ Extended'}
                                    </Badge>
                                    <span>📅 {search.created_at.toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <Badge className={getStatusColor(search.status)}>
                                  {search.status}
                                </Badge>
                              </div>

                              {search.results && (
                                <div className="bg-gray-50 rounded-md p-3">
                                  <p className="text-sm text-gray-700">
                                    ✅ Search completed with results
                                  </p>
                                </div>
                              )}

                              {search.status === 'processing' && (
                                <div className="flex items-center space-x-2 text-sm text-blue-600">
                                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                  <span>Searching the web...</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Think Tab */}
          <TabsContent value="think" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  
                  <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
                    <Brain className="w-8 h-8" />
                    <span>AI Think Mode 🧠</span>
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Watch the AI think step-by-step through complex problems
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleAiThink} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        What would you like the AI to think about? 🤔
                      </label>
                      <Textarea
                        placeholder="Ask a complex question or present a problem for the AI to reason through..."
                        value={thinkQuery}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                          setThinkQuery(e.target.value)
                        }
                        className="min-h-[120px]"
                      />
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="showReasoning"
                        checked={showReasoning}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          setShowReasoning(e.target.checked)
                        }
                        className="rounded"
                      />
                      <label htmlFor="showReasoning" className="text-sm">
                        🔍 Show detailed reasoning process
                      </label>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={!thinkQuery.trim() || !selectedModel || isLoading}
                      className="w-full py-3"
                      size="lg"
                    >
                      {isLoading ? '🧠 AI is thinking...' : '🚀 Start AI Thinking'}
                    </Button>
                  </form>

                  {isLoading && (
                    <div className="border rounded-lg p-6 bg-gradient-to-r from-purple-50 to-blue-50">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="animate-pulse bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-2">
                          <Brain className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium">AI is processing your request...</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-gray-600">Analyzing the problem...</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150"></div>
                          <span className="text-sm text-gray-600">Generating reasoning steps...</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-300"></div>
                          <span className="text-sm text-gray-600">Formulating response...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-center text-gray-500 py-8">
                    <Brain className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">🤖 Ready to think!</p>
                    <p className="text-sm">Ask the AI to reason through complex problems, make decisions, or explain step-by-step solutions.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
