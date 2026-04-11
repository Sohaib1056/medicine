import React from 'react';
import { ShoppingCart, Package } from 'lucide-react';

const ComboDealSection = () => {
  const combos = [
    {
      emoji: '✨',
      name: 'Complete Skincare Routine',
      products: ['Face Wash', 'Toner', 'Moisturizer', 'Sunscreen'],
      save: 800,
      discount: 35,
      price: 1499,
      originalPrice: 2299,
    },
    {
      emoji: '💇',
      name: 'Hair Care Essentials',
      products: ['Shampoo', 'Conditioner', 'Hair Serum', 'Hair Mask'],
      save: 600,
      discount: 30,
      price: 1399,
      originalPrice: 1999,
    },
    {
      emoji: '🧴',
      name: 'Body Care Bundle',
      products: ['Body Wash', 'Body Lotion', 'Body Scrub', 'Hand Cream'],
      save: 500,
      discount: 28,
      price: 1299,
      originalPrice: 1799,
    },
    {
      emoji: '🪒',
      name: "Men's Grooming Kit",
      products: ['Shaving Gel', 'Aftershave', 'Face Wash', 'Moisturizer'],
      save: 700,
      discount: 32,
      price: 1599,
      originalPrice: 2299,
    },
  ];

  return (
    <section className="py-16 px-4 bg-[#F5F5F5]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2">
            Combo Deals - Save More!
          </h2>
          <p className="text-[#666666]">
            Get complete care bundles at amazing prices
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {combos.map((combo, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] rounded-xl p-6 hover:shadow-xl transition"
            >
              <div className="flex items-start gap-4">
                {/* Emoji Icon */}
                <div className="text-5xl">{combo.emoji}</div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-[#1A1A1A] mb-3">
                    {combo.name}
                  </h3>

                  {/* Products List */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {combo.products.map((product, idx) => (
                      <span
                        key={idx}
                        className="bg-white text-[#00A651] text-xs font-medium px-3 py-1 rounded-full"
                      >
                        {product}
                      </span>
                    ))}
                  </div>

                  {/* Savings */}
                  <div className="bg-white rounded-lg p-3 mb-4 inline-block">
                    <p className="text-[#00A651] font-bold text-lg">
                      Save Rs. {combo.save} ({combo.discount}% OFF)
                    </p>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl font-bold text-[#1A1A1A]">
                      Rs. {combo.price}
                    </span>
                    <span className="text-lg text-[#666666] line-through">
                      Rs. {combo.originalPrice}
                    </span>
                  </div>

                  {/* Add to Cart Button */}
                  <button className="bg-[#00A651] text-white px-6 py-3 rounded-lg hover:bg-[#008f47] transition font-bold flex items-center gap-2">
                    <ShoppingCart size={20} />
                    Add Combo to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ComboDealSection;
