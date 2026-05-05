import math
import re
from collections import Counter
from abc import ABC, abstractmethod

# 1. ENCAPSULATION
# We bundle data (children, is_end, pages) and restrict direct access by naming convention.
class TrieNode:
    """Represents a single node in the Trie structure."""
    def __init__(self):
        self.children = {}      # Map of character -> TrieNode
        self.is_end_of_word = False
        self.pages = set()      # Set of page numbers where word appears

# 2. ABSTRACTION
# We define an Abstract Base Class (ABC) to outline 'what' an indexer should do 
# without specifying 'how' it works.
class BaseIndexer(ABC):
    """Abstract base class for all book indexing systems."""
    
    @abstractmethod
    def insert(self, word, page_number):
        """Must be implemented to insert a word and its page reference."""
        pass

    @abstractmethod
    def get_alphabetical_index(self):
        """Must be implemented to return the final sorted index data."""
        pass

# 3. INHERITANCE
# BookTrie inherits from BaseIndexer, gaining its interface.
class BookTrie(BaseIndexer):
    """A Trie-based implementation of a book indexer."""
    
    def __init__(self):
        # 4. ENCAPSULATION (continued)
        # Using a single underscore '_' for 'protected' attributes.
        self._root = TrieNode()
        self._exclude_words = set()

    @staticmethod
    def calculate_tfidf(documents):
        """Static method: Example of utility abstraction."""
        num_docs = len(documents)
        if num_docs == 0: return []

        doc_word_counts = []
        all_words = set()
        df = Counter()

        for doc in documents:
            words = re.findall(r'[a-zA-Z]+', doc)
            words = [w.lower() for w in words]
            word_counts = Counter(words)
            doc_word_counts.append(word_counts)
            for word in word_counts:
                df[word] += 1
                all_words.add(word)

        tfidf_scores = {}
        for word in all_words:
            idf = math.log(num_docs / df[word])
            total_tfidf = 0
            for i in range(num_docs):
                count = doc_word_counts[i].get(word, 0)
                doc_size = sum(doc_word_counts[i].values())
                tf = count / doc_size if doc_size > 0 else 0
                total_tfidf += tf * idf
            tfidf_scores[word] = total_tfidf / num_docs

        sorted_scores = sorted(tfidf_scores.items(), key=lambda x: x[1])
        return [{"word": word, "score": score} for word, score in sorted_scores]

    # 5. POLYMORPHISM
    # We define a method that can be overridden in subclasses to change behavior.
    def _normalize_word(self, word):
        """Normalizes the word before insertion. Can be overridden."""
        return word.lower()

    def add_exclude_word(self, word):
        """Public method to add a word to the exclusion list."""
        if word:
            self._exclude_words.add(word.lower())

    def load_exclude_words_from_text(self, text):
        """Adds words to the protected exclusion set."""
        lines = text.split('\n')
        for line in lines:
            word = line.strip().lower()
            if word:
                self._exclude_words.add(word)

    # Implementing the abstract 'insert' method
    def insert(self, word, page_number):
        # Using polymorphism here: calls _normalize_word which could be overridden
        word = self._normalize_word(word)
        
        if not word or word in self._exclude_words:
            return

        node = self._root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        
        node.is_end_of_word = True
        node.pages.add(page_number)

    def process_page_text(self, text, page_number):
        """Processes text for a specific page."""
        words = re.findall(r'[a-zA-Z]+', text)
        for word in words:
            self.insert(word, page_number)

    # Implementing the abstract 'get_alphabetical_index' method
    def get_alphabetical_index(self):
        result = []
        
        def dfs(node, prefix):
            if node.is_end_of_word:
                result.append({
                    "word": prefix,
                    "pages": sorted(list(node.pages))
                })
            for char in sorted(node.children.keys()):
                dfs(node.children[char], prefix + char)
                
        dfs(self._root, "")
        return result

# 6. POLYMORPHISM (DEMONSTRATION)
# Creating a specialized indexer that inherits from BookTrie.
class CaseSensitiveIndexer(BookTrie):
    """An indexer that preserves casing (Polymorphic behavior)."""
    
    # Overriding the polymorphic method
    def _normalize_word(self, word):
        """Overrides the base normalization to preserve case."""
        return word # No .lower() call here

