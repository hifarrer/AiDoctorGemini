// Test the getBackgroundClasses function logic
function getBackgroundClasses(bgColor) {
  switch (bgColor) {
    case 'gradient-orange':
      return {
        background: 'bg-gradient-to-br from-orange-500 to-orange-700',
        text: 'text-white',
        textSecondary: 'text-orange-100'
      };
    case 'gradient-blue':
      return {
        background: 'bg-gradient-to-br from-blue-500 to-blue-700',
        text: 'text-white',
        textSecondary: 'text-blue-100'
      };
    default:
      return {
        background: 'bg-gradient-to-br from-blue-500 to-blue-700',
        text: 'text-white',
        textSecondary: 'text-blue-100'
      };
  }
}

const bgColor = 'gradient-orange';
const classes = getBackgroundClasses(bgColor);
console.log('Background color:', bgColor);
console.log('Generated classes:', classes);
console.log('Full class string:', `min-h-screen ${classes.background} ${classes.text} relative overflow-hidden`);
