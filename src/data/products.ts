import { Product, Category } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../services/mockData';

import heroImg from '../assets/images/hero_bubae_fashion_1790539079845.jpg';
import dressesImg from '../assets/images/category_dresses_portrait_1790539088645.jpg';
import coordsImg from '../assets/images/category_coords_portrait_1790539099149.jpg';
import kurtisImg from '../assets/images/category_kurtis_portrait_1790539110256.jpg';
import aboutImg from '../assets/images/about_brand_campaign_1790539122714.jpg';
import shirtsImg from '../assets/images/product_shirts_portrait_1790539156751.jpg';
import topsImg from '../assets/images/product_tops_portrait_1790539168227.jpg';
import bottomsImg from '../assets/images/product_bottoms_portrait_1790539180466.jpg';
import tshirtsImg from '../assets/images/product_tshirts_portrait_1790539191872.jpg';

export const BRAND_IMAGES = {
  hero: heroImg,
  dresses: dressesImg,
  coords: coordsImg,
  kurtis: kurtisImg,
  about: aboutImg,
  shirts: shirtsImg,
  tops: topsImg,
  bottoms: bottomsImg,
  tshirts: tshirtsImg,
};

export const CATEGORIES: Category[] = INITIAL_CATEGORIES;

export const PRODUCTS: Product[] = INITIAL_PRODUCTS;
