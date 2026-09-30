import React, { useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { Product } from '../types';

interface SEOHeadProps {
  product?: Product | null;
  customTitle?: string;
  customDescription?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ product, customTitle, customDescription }) => {
  const { route, currentPath } = useNavigation();

  // Configurable base URL for canonical indexing
  const siteUrl = (import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://bubae.com')).replace(/\/+$/, '');

  useEffect(() => {
    // 1. Determine Title & Meta Description based on current page
    let title = 'Bubaé — Modern Fashion Within Your Budget | Official Online Store Bangladesh';
    let description = 'Shop the official Bubaé online store. Contemporary women\'s & girls\' apparel within your budget. Cash on Delivery across all 64 districts in Bangladesh.';
    let isNoIndex = false;
    let ogType = 'website';
    let ogImage = `${siteUrl}/hero_fashion.jpg`;

    if (route.name.startsWith('admin')) {
      isNoIndex = true;
      title = 'Bubaé Studio | Admin Operations';
      description = 'Authorized Bubaé Studio operations.';
    } else {
      switch (route.name) {
        case 'home':
          title = 'Bubaé — Modern Fashion Within Your Budget | Official Store Bangladesh';
          description = 'Discover modern girls\' & women\'s fashion at Bubaé. Shop stylish cargo pants, tailored blush trousers, and minimalist cotton t-shirts with nationwide COD.';
          break;

        case 'shop':
        case 'category': {
          const categorySlug = route.name === 'category' ? route.slug : route.category;
          const catName = categorySlug
            ? categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())
            : 'All Apparel';
          title = `${catName} Collection — Bubaé | Modern Women's Fashion Bangladesh`;
          description = `Explore Bubaé’s curated ${catName.toLowerCase()} collection. Premium fabrics, tailored feminine fits, and budget-friendly everyday styling with Cash on Delivery nationwide.`;
          break;
        }

        case 'product':
          if (product) {
            title = `${product.name} — Bubaé | Modern Fashion Within Your Budget`;
            description = product.description
              ? product.description.slice(0, 155)
              : `Buy ${product.name} at Bubaé. Modern fashion within your budget. ৳${product.price}. Cash on Delivery across Bangladesh.`;
            ogType = 'product';
            ogImage = product.image_url || ogImage;
          }
          break;

        case 'about':
          title = 'About Bubaé — Philosophy, Craft & The Independent Label';
          description = 'Learn about Bubaé, an independent fashion label creating modern, comfortable clothing within your budget for young women and girls in Bangladesh.';
          break;

        case 'delivery':
          title = 'Delivery Information & Nationwide COD Rates | Bubaé';
          description = 'Fast nationwide Cash on Delivery across all 64 districts in Bangladesh. Sylhet main town ৳80, outside main town ৳115, divisional ৳135, nationwide ৳155.';
          break;

        case 'size-guide':
          title = 'Size & Fit Guide — S, M, L, XL, XXL | Bubaé';
          description = 'Find your perfect fit with Bubaé’s comprehensive size and measurement charts for pants, trousers, minimalist t-shirts, and oversized tops.';
          break;

        case 'return-policy':
          title = 'Terms & Delivery Policy | Bubaé Official Store';
          description = 'Read Bubaé\'s clear Cash on Delivery policies, transparent inspection standards, and order fulfillment terms.';
          break;

        case 'faq':
          title = 'Frequently Asked Questions (FAQ) | Bubaé';
          description = 'Answers to common questions about Cash on Delivery orders, delivery timescales across Bangladesh districts, and sizing options at Bubaé.';
          break;

        case 'contact':
          title = 'Customer Support & Inquiries | Bubaé';
          description = 'Contact Bubaé customer care via WhatsApp or direct phone. Fast assistance with Cash on Delivery orders, sizing inquiries, and delivery updates.';
          break;

        case 'cart':
        case 'checkout':
          title = 'Secure COD Checkout — Bubaé';
          description = 'Complete your Cash on Delivery order with Bubaé. No advance payment required. Nationwide delivery.';
          isNoIndex = true;
          break;
      }
    }

    if (customTitle) title = customTitle;
    if (customDescription) description = customDescription;

    // Apply Document Title
    document.title = title;

    // Helper to safely set or update meta tag
    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to safely set canonical link
    const setCanonicalLink = (url: string) => {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', url);
    };

    // Standard Meta Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', 'Bubaé, Bubae, Bubaé clothing, Bubaé fashion, Bubaé Bangladesh, Bubaé online shop, Bubaé Sylhet, women clothing Bangladesh, girls clothing, modern fashion within your budget');
    setMetaTag('name', 'author', 'Bubaé');

    // Robots Directive
    if (isNoIndex) {
      setMetaTag('name', 'robots', 'noindex, nofollow, noarchive');
    } else {
      setMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }

    // Canonical URL
    const canonicalPath = currentPath === '/' ? '' : currentPath;
    const fullCanonicalUrl = `${siteUrl}${canonicalPath}`;
    setCanonicalLink(fullCanonicalUrl);

    // OpenGraph Social Cards
    setMetaTag('property', 'og:site_name', 'Bubaé');
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', fullCanonicalUrl);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:locale', 'en_US');

    // Twitter / X Social Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage);

    // 2. Structured Data (Schema.org JSON-LD)
    const existingJsonLd = document.getElementById('bubae-schema-jsonld');
    if (existingJsonLd) {
      existingJsonLd.remove();
    }

    // Prepare JSON-LD schemas
    const schemas: any[] = [
      // Organization Schema
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'Bubaé',
        'alternateName': ['Bubae', 'Bubaé Bangladesh', 'Bubaé Clothing'],
        'url': siteUrl,
        'logo': `${siteUrl}/logo.png`,
        'description': 'Modern fashion within your budget. Contemporary women\'s and girls\' apparel with nationwide Cash on Delivery across Bangladesh.',
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': 'Sylhet',
          'addressCountry': 'BD',
        },
        'sameAs': [
          'https://instagram.com/bubae.official',
          'https://facebook.com/bubaebd',
        ],
        'priceRange': '৳৳',
      },
      // WebSite Schema with SearchAction
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'Bubaé Official Store',
        'url': siteUrl,
        'potentialAction': {
          '@type': 'SearchAction',
          'target': `${siteUrl}/shop?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ];

    // Product Schema (when viewing product)
    if (route.name === 'product' && product) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': product.name,
        'image': [product.image_url, product.second_image_url].filter(Boolean),
        'description': product.description || `Buy ${product.name} at Bubaé. Modern fashion within your budget.`,
        'sku': product.slug,
        'brand': {
          '@type': 'Brand',
          'name': 'Bubaé',
        },
        'offers': {
          '@type': 'Offer',
          'url': fullCanonicalUrl,
          'priceCurrency': 'BDT',
          'price': product.price,
          'priceValidUntil': '2027-12-31',
          'availability': product.is_available && product.stock > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          'itemCondition': 'https://schema.org/NewCondition',
          'seller': {
            '@type': 'Organization',
            'name': 'Bubaé',
          },
        },
      });

      // BreadcrumbList Schema for Product
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': siteUrl,
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Shop',
            'item': `${siteUrl}/shop`,
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': product.name,
            'item': fullCanonicalUrl,
          },
        ],
      });
    }

    const script = document.createElement('script');
    script.id = 'bubae-schema-jsonld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schemas);
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById('bubae-schema-jsonld');
      if (el) el.remove();
    };
  }, [route, currentPath, product, customTitle, customDescription, siteUrl]);

  return null;
};
