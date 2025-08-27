import React, { useState, useEffect, useMemo, useCallback } from "react";
import { X, Plus, Library, ChevronRight, Search, Flag, FileType2, ChevronDown, List, Laptop, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from '@/lib/supabase/client';
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { toast } from 'sonner';

interface ChallengeLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChallenges: (question_ids: string[]) => Promise<void>;
  existingChallengeIds: string[];
}

interface Question {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  difficulty: string;
  score: number;
  tags: string[];
  no_of_flags: number;
  instance_id: string;
  template_id: string;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 0.5,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1]
    }
  }
};

const modalVariants = {
  hidden: {
    x: "100%",
    opacity: 0
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 30,
      stiffness: 300,
      mass: 0.8
    }
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: {
      type: "spring",
      damping: 30,
      stiffness: 300,
      mass: 0.8
    }
  }
};

const iconVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20
    }
  }
};

const formatChallengeType = (type: string): string => {
  switch (type) {
    case 'web': return 'Web Exploitation';
    case 'pwn': return 'Binary Exploitation';
    case 'crypto': return 'Cryptography';
    case 'forensics': return 'Forensics';
    case 'reverse': return 'Reverse Engineering';
    case 'misc': return 'Miscellaneous';
    case 'osint': return 'OSINT';
    case 'steganography': return 'Steganography';
    default: return type.toUpperCase();
  }
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

const ChallengeCard = React.memo(({ 
  challenge, 
  isExpanded,
  onExpand,
  enableSelection,
  selectedChallenges,
  onChallengeSelect
}: {
  challenge: Question;
  isExpanded: boolean;
  onExpand: (id: string) => void;
  enableSelection: boolean;
  selectedChallenges: Set<string>;
  onChallengeSelect: (id: string) => void;
}) => {
  return (
    <div className="relative animate-fadeIn" style={{ animationDuration: '0.5s' }}>
      <div
        className="bg-dark-secondary border border-gray-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
        onClick={() => onExpand(challenge.id)}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-medium text-white mr-2">
                {challenge.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full uppercase
                  ${challenge.difficulty?.toLowerCase() === "easy" ? "text-emerald-600 bg-emerald-50" : ""}
                  ${challenge.difficulty?.toLowerCase() === "medium" ? "text-amber-600 bg-amber-50" : ""}
                  ${challenge.difficulty?.toLowerCase() === "hard" ? "text-red-600 bg-red-50" : ""}`}
                >
                  {challenge.difficulty}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {enableSelection && (
                <input
                  type="checkbox"
                  checked={selectedChallenges.has(challenge.id)}
                  onChange={() => onChallengeSelect(challenge.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-5 w-5 text-neon-green focus:ring-neon-green border-gray-300 rounded"
                />
              )}
              <ChevronDown
                className={`h-5 w-5 text-gray-500 transition-transform duration-200
                  ${isExpanded ? "rotate-180" : ""}`}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mb-3 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <FileType2 className="w-5 h-5" />
              {formatChallengeType(challenge.type)}
            </span>
            <span className="flex items-center gap-1">
              <Hash className="w-5 h-5" />
              {challenge.score} Points
            </span>
            {challenge.category && (
              <span className="flex items-center gap-1">
                <List className="w-5 h-5 mr-1" />
                {challenge.category}
              </span>
            )}
            {(challenge.instance_id || challenge.template_id) && (
              <span className="flex items-center gap-1">
                <Laptop className="w-5 h-5 mr-1" />
                Instance
              </span>
            )}
            {challenge.no_of_flags > 0 && (
              <span className="flex items-center gap-1">
                <Flag className="w-5 h-5" />
                {challenge.no_of_flags} Flags
              </span>
            )}
          </div>

          {challenge.description && (
            <p className="text-sm text-gray-300 mb-4 text-left">
              {truncateText(challenge.description, 150)}
            </p>
          )}

          {challenge.tags && challenge.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {challenge.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-dark-bg text-gray-300 rounded-md border border-gray-border"
                >
                  {tag}
                </span>
              ))}
              {challenge.tags.length > 3 && (
                <span className="px-2 py-1 text-xs bg-dark-bg text-gray-300 rounded-md border border-gray-border">
                  +{challenge.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {isExpanded && (
            <div className="border-t pt-4 mt-4 cursor-default" onClick={(e) => e.stopPropagation()}>
              <div className="prose prose-sm max-w-none text-gray-300">
                <div className="whitespace-pre-line">{challenge.description}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ChallengeCard.displayName = 'ChallengeCard';

const ChallengeLibraryModal: React.FC<ChallengeLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectChallenges,
  existingChallengeIds,
}) => {
  const [selectedChallenges, setSelectedChallenges] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challenges, setChallenges] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedChallengeId, setExpandedChallengeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    difficulty: [] as string[],
    type: [] as string[],
    categories: [] as string[],
  });

  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      setSelectedChallenges(new Set());
      document.body.style.overflow = 'hidden';
      fetchChallenges();
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const fetchChallenges = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChallengeSelect = (challengeId: string) => {
    setSelectedChallenges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(challengeId)) {
        newSet.delete(challengeId);
      } else {
        newSet.add(challengeId);
      }
      return newSet;
    });
  };

  const handleRowClick = useCallback((challengeId: string) => {
    setExpandedChallengeId(prevId => prevId === challengeId ? null : challengeId);
  }, []);

  // Optimized filtering with proper memoization
  const filteredChallenges = useMemo(() => {
    if (!challenges.length) return [];

    return challenges.filter(challenge => {
      if (existingChallengeIds.includes(challenge.id)) return false;

      const matchesSearch = !searchQuery ||
        challenge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = !filters.type.length ||
        filters.type.includes(challenge.type);

      const matchesDifficulty = !filters.difficulty.length ||
        filters.difficulty.includes(challenge.difficulty?.toLowerCase());

      const matchesCategories = !filters.categories.length ||
        (challenge.category && filters.categories.includes(challenge.category));

      return matchesSearch && matchesType && matchesDifficulty && matchesCategories;
    });
  }, [challenges, searchQuery, filters, existingChallengeIds]);

  const handleAdd = async () => {
    if (selectedChallenges.size === 0) return;

    setIsSubmitting(true);
    try {
      await onSelectChallenges(Array.from(selectedChallenges));
      onClose();
    } catch (error: any) {
      console.error("Error adding challenges:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const uniqueTypes = Array.from(new Set(challenges.map(c => c.type)));
  const uniqueDifficulties = Array.from(new Set(challenges.map(c => c.difficulty)));
  const uniqueCategories = Array.from(new Set(challenges.map(c => c.category).filter(Boolean)));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="modal-overlay"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal-content"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            className="fixed right-0 top-0 h-full w-full md:w-[75vw] bg-dark-bg shadow-2xl z-50 overflow-hidden
              border-l border-gray-border rounded-l-2xl"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <motion.div
                className="flex items-center justify-between border-b border-gray-border p-6 bg-dark-secondary
                  sticky top-0 z-10"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    className="p-3 rounded-2xl bg-neon-green/10 backdrop-blur-sm ring-1 ring-neon-green/20"
                    variants={iconVariants}
                    initial="initial"
                    animate="animate"
                  >
                    <Library className="h-6 w-6 text-neon-green" />
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-2xl font-semibold text-white tracking-tight">Challenge Library</h2>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <motion.span
                        className={cn(
                          "px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200",
                          selectedChallenges.size > 0
                            ? "bg-neon-green/20 text-neon-green ring-1 ring-neon-green/30"
                            : "bg-gray-600 text-gray-300 ring-1 ring-gray-500"
                        )}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {selectedChallenges.size} selected
                      </motion.span>
                    </div>
                    <p className="text-sm text-gray-400">Select challenges to add to your assessment</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="rounded-xl bg-dark-bg border-gray-border text-gray-300 hover:bg-gray-700 transition-all duration-200"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={handleAdd}
                    disabled={selectedChallenges.size === 0 || isSubmitting}
                    className={cn(
                      "rounded-xl transition-all duration-200",
                      selectedChallenges.size > 0 && !isSubmitting
                        ? "bg-gradient-to-r from-neon-green to-electric-blue text-dark-bg hover:from-green-500 hover:to-blue-500 shadow-sm hover:shadow-md"
                        : "bg-gray-600 text-gray-400 hover:bg-gray-500"
                    )}
                  >
                    {isSubmitting ? (
                      <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                        <span>Adding...</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Selected</span>
                      </motion.div>
                    )}
                  </Button>
                </div>
              </motion.div>

              {/* Content */}
              <motion.div
                className="flex-1 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <div className="flex h-full">
                  {/* Sidebar Filters */}
                  <div className="w-64 border-r border-gray-border bg-dark-secondary p-4 overflow-y-auto">
                    <div className="space-y-6">
                      {/* Search */}
                      <div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search challenges..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-gray-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-green"
                          />
                        </div>
                      </div>

                      {/* Difficulty Filter */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Difficulty</h3>
                        <div className="space-y-2">
                          {uniqueDifficulties.map(difficulty => (
                            <label key={difficulty} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={filters.difficulty.includes(difficulty?.toLowerCase())}
                                onChange={(e) => {
                                  const value = difficulty?.toLowerCase();
                                  if (e.target.checked) {
                                    setFilters(prev => ({
                                      ...prev,
                                      difficulty: [...prev.difficulty, value]
                                    }));
                                  } else {
                                    setFilters(prev => ({
                                      ...prev,
                                      difficulty: prev.difficulty.filter(d => d !== value)
                                    }));
                                  }
                                }}
                                className="h-4 w-4 text-neon-green focus:ring-neon-green border-gray-300 rounded mr-2"
                              />
                              <span className="text-sm text-gray-300 capitalize">{difficulty}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Type Filter */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Type</h3>
                        <div className="space-y-2">
                          {uniqueTypes.map(type => (
                            <label key={type} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={filters.type.includes(type)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFilters(prev => ({
                                      ...prev,
                                      type: [...prev.type, type]
                                    }));
                                  } else {
                                    setFilters(prev => ({
                                      ...prev,
                                      type: prev.type.filter(t => t !== type)
                                    }));
                                  }
                                }}
                                className="h-4 w-4 text-neon-green focus:ring-neon-green border-gray-300 rounded mr-2"
                              />
                              <span className="text-sm text-gray-300">{formatChallengeType(type)}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Category Filter */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Category</h3>
                        <div className="space-y-2">
                          {uniqueCategories.map(category => (
                            <label key={category} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={filters.categories.includes(category)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFilters(prev => ({
                                      ...prev,
                                      categories: [...prev.categories, category]
                                    }));
                                  } else {
                                    setFilters(prev => ({
                                      ...prev,
                                      categories: prev.categories.filter(c => c !== category)
                                    }));
                                  }
                                }}
                                className="h-4 w-4 text-neon-green focus:ring-neon-green border-gray-300 rounded mr-2"
                              />
                              <span className="text-sm text-gray-300">{category}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green"></div>
                        <p className="text-gray-300 ml-3">Loading challenges...</p>
                      </div>
                    ) : filteredChallenges.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Library className="h-12 w-12 mb-4" />
                        <p className="text-lg font-medium">No challenges found</p>
                        <p className="text-sm">Try adjusting your filters or search terms</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredChallenges.map(challenge => (
                          <ChallengeCard
                            key={challenge.id}
                            challenge={challenge}
                            isExpanded={expandedChallengeId === challenge.id}
                            onExpand={handleRowClick}
                            enableSelection={true}
                            selectedChallenges={selectedChallenges}
                            onChallengeSelect={handleChallengeSelect}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChallengeLibraryModal;
