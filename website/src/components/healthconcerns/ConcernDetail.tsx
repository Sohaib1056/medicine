import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

interface ConcernDetailProps {
  concern: string;
}

const concernData: Record<string, {
  name: string;
  description: string;
  products: Array<{
    name: string;
    category: string;
    price: number;
    oldPrice: number;
    rating: number;
    reviews: number;
    discount: number;
    image: string;
  }>;
  tests: Array<{
    name: string;
    price: number;
  }>;
}> = {
  heart: {
    name: 'Heart Care',
    description: 'Maintain cardiovascular health with our range of heart care medicines, supplements, and monitoring devices. Find products for cholesterol management, blood pressure control, and overall heart wellness.',
    products: [
      { name: 'Aspirin 75mg Tablets', category: 'CARDIAC', price: 120, oldPrice: 150, rating: 4.5, reviews: 89, discount: 20, image: '/placeholder.svg' },
      { name: 'Atorvastatin 20mg', category: 'CARDIAC', price: 450, oldPrice: 600, rating: 4.7, reviews: 156, discount: 25, image: '/placeholder.svg' },
      { name: 'CoQ10 100mg Capsules', category: 'SUPPLEMENTS', price: 890, oldPrice: 1200, rating: 4.6, reviews: 78, discount: 26, image: '/placeholder.svg' },
      { name: 'Omega-3 Fish Oil', category: 'SUPPLEMENTS', price: 1200, oldPrice: 1500, rating: 4.8, reviews: 234, discount: 20, image: '/placeholder.svg' },
    ],
    tests: [
      { name: 'Lipid Profile Test', price: 800 },
      { name: 'ECG Test', price: 1200 },
      { name: 'Cardiac Enzyme Test', price: 2500 },
    ],
  },
  diabetes: {
    name: 'Diabetes',
    description: 'Manage diabetes effectively with our comprehensive range of medicines, glucose monitors, test strips, and dietary supplements designed for blood sugar control.',
    products: [
      { name: 'Metformin 500mg', category: 'DIABETES', price: 180, oldPrice: 220, rating: 4.6, reviews: 312, discount: 18, image: '/placeholder.svg' },
      { name: 'Glucometer with Strips', category: 'DEVICES', price: 2500, oldPrice: 3200, rating: 4.7, reviews: 189, discount: 22, image: '/placeholder.svg' },
      { name: 'Diabetic Protein Powder', category: 'SUPPLEMENTS', price: 1800, oldPrice: 2200, rating: 4.5, reviews: 95, discount: 18, image: '/placeholder.svg' },
      { name: 'Sugar Free Tablets', category: 'DIABETES', price: 150, oldPrice: 180, rating: 4.4, reviews: 67, discount: 17, image: '/placeholder.svg' },
    ],
    tests: [
      { name: 'HbA1c Test', price: 900 },
      { name: 'Fasting Blood Sugar', price: 300 },
      { name: 'Random Blood Sugar', price: 250 },
    ],
  },
  bp: {
    name: 'Blood Pressure',
    description: 'Control and monitor blood pressure with our selection of antihypertensive medications, BP monitors, and heart-healthy supplements.',
    products: [
      { name: 'Amlodipine 5mg', category: 'CARDIAC', price: 220, oldPrice: 280, rating: 4.6, reviews: 245, discount: 21, image: '/placeholder.svg' },
      { name: 'BP Monitor Digital', category: 'DEVICES', price: 3500, oldPrice: 4500, rating: 4.8, reviews: 456, discount: 22, image: '/placeholder.svg' },
      { name: 'Losartan 50mg', category: 'CARDIAC', price: 380, oldPrice: 450, rating: 4.5, reviews: 178, discount: 16, image: '/placeholder.svg' },
      { name: 'Garlic Extract Capsules', category: 'SUPPLEMENTS', price: 650, oldPrice: 800, rating: 4.4, reviews: 89, discount: 19, image: '/placeholder.svg' },
    ],
    tests: [
      { name: '24-Hour BP Monitoring', price: 3500 },
      { name: 'Kidney Function Test', price: 1200 },
    ],
  },
};

const ConcernDetail: React.FC<ConcernDetailProps> = ({ concern }) => {
  const data = concernData[concern];
  
  if (!data) return null;

  return (
    <div className="bg-[#E8F5E9] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#00A651] mb-3">{data.name}</h2>
          <p className="text-gray-700 text-base leading-relaxed max-w-4xl">
            {data.description}
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {data.products.map((product, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <div className="bg-gray-100 h-48 flex items-center justify-center">
                  <span className="text-4xl">💊</span>
                </div>
                <span className="absolute top-2 left-2 bg-[#E53935] text-white text-xs font-bold px-2 py-1 rounded">
                  {product.discount}% OFF
                </span>
              </div>
              
              <div className="p-4">
                <p className="text-[10px] text-[#00A651] font-semibold mb-1">{product.category}</p>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                
                <div className="flex items-center gap-1 mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">({product.reviews})</span>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-bold text-[#00A651]">Rs. {product.price}</span>
                  <span className="text-sm text-gray-400 line-through">Rs. {product.oldPrice}</span>
                </div>
                
                <button className="w-full bg-[#00A651] text-white py-2 rounded-md hover:bg-[#008f47] transition-colors text-sm font-medium">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Consult Doctor CTA */}
        <div className="text-center mb-8">
          <button className="bg-[#00BFA5] text-white px-8 py-3 rounded-lg hover:bg-[#00a892] transition-colors font-medium">
            Consult a Doctor
          </button>
        </div>

        {/* Related Lab Tests */}
        {data.tests && data.tests.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Related Lab Tests</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.tests.map((test, index) => (
                <Link
                  key={index}
                  to="/lab-tests"
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#00A651] hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">{test.name}</h4>
                      <p className="text-[#00A651] font-bold">Rs. {test.price}</p>
                    </div>
                    <button className="text-[#00A651] text-sm font-medium hover:underline">
                      Book →
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConcernDetail;
