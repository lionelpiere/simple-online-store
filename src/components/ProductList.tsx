import React, { useState, useMemo } from 'react';
import type { Product, ProductCategory, SortOption } from '../types/ecommerce';
import { ProductCard } from './ProductCard';
import '../styles/catalog.css';

interface ProductListProps {
  products: readonly Product[];
  onSelectProduct: (productId: string) => void;
}

const CATEGORIES: readonly (ProductCategory | 'All')[] = [
  'All',
  'Electronics',
  'Apparel',
  'Home',
  'Books',
];

const isSortOption = (value: string): value is SortOption => {
  return (
    value === 'price-asc' ||
    value === 'price-desc' ||
    value === 'name-asc' ||
    value === 'name-desc'
  );
};

export const ProductList: React.FC<ProductListProps> = ({
  products,
  onSelectProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(event.target.value);
  };

  const handleCategoryChange = (category: ProductCategory | 'All'): void => {
    setSelectedCategory(category);
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const value = event.target.value;
    if (isSortOption(value)) {
      setSortBy(value);
    }
  };

  const handleResetFilters = (): void => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSortBy('price-asc');
  };

  const visibleProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = products.filter((product: Product) => {
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesSearch;
    });

    const sorted = [...filtered].sort((a: Product, b: Product): number => {
      if (sortBy === 'price-asc') {
        return a.priceCents - b.priceCents;
      }
      if (sortBy === 'price-desc') {
        return b.priceCents - a.priceCents;
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      return b.name.localeCompare(a.name);
    });

    return sorted;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const isFilterActive =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'All' ||
    sortBy !== 'price-asc';

  return (
    <section className="catalog-section" aria-label="Product Catalog">
      <div className="catalog-toolbar">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Search products by name"
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-button"
              onClick={(): void => setSearchQuery('')}
              aria-label="Clear search query"
            >
              Clear
            </button>
          )}
        </div>

        <div className="toolbar-controls">
          <div className="category-filters" role="group" aria-label="Category filters">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                className={`category-button ${
                  selectedCategory === category ? 'active' : ''
                }`}
                onClick={(): void => handleCategoryChange(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="sort-selector-wrap">
            <label htmlFor="product-sort-select" className="sort-label">
              Sort by:
            </label>
            <select
              id="product-sort-select"
              className="sort-select"
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>
        </div>
      </div>

      <div className="catalog-meta">
        <span className="results-count">
          Showing {visibleProducts.length} of {products.length} products
        </span>
        {isFilterActive && (
          <button
            type="button"
            className="reset-filters-button"
            onClick={handleResetFilters}
          >
            Reset filters
          </button>
        )}
      </div>

      {visibleProducts.length === 0 ? (
        <div className="no-results-card">
          <h3 className="no-results-title">No products found</h3>
          <p className="no-results-text">
            No items matched your current search and filter combination.
          </p>
          <button
            type="button"
            className="reset-filters-button primary"
            onClick={handleResetFilters}
          >
            Reset search and filters
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {visibleProducts.map((product: Product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      )}
    </section>
  );
};
