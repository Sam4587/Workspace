import React from 'react';

const ContentTypeSelector = ({ types, selectedType, onTypeChange }) => {
  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50 text-blue-700',
    green: 'border-green-500 bg-green-50 text-green-700',
    purple: 'border-purple-500 bg-purple-50 text-purple-700',
    orange: 'border-orange-500 bg-orange-50 text-orange-700'
  };

  const defaultClasses = 'border-gray-200 hover:border-gray-300 hover:bg-gray-50';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">选择内容类型</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {types.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          const colorClass = colorClasses[type.color];
          
          return (
            <button
              key={type.id}
              onClick={() => onTypeChange(type.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                isSelected ? colorClass : defaultClasses
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`h-6 w-6 ${isSelected ? type.color + '-600' : 'text-gray-400'}`} />
                <div>
                  <h4 className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                    {type.name}
                  </h4>
                  <p className={`text-sm ${isSelected ? 'text-gray-600' : 'text-gray-500'}`}>
                    {type.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ContentTypeSelector;
