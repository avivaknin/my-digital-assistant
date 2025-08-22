
import type { MainCategory } from '../types';
import { 
    HeartIcon, 
    BankIcon, 
    PhoneIcon, 
    MapIcon, 
    TvIcon, 
    CameraIcon, 
    MonitorIcon,
    BookOpenIcon,
    WrenchScrewdriverIcon,
    CogIcon,
    HomeIcon,
    ShieldIcon,
    BookmarkIcon
} from '../components/icons';

// Import sub-category data from dedicated files
import { healthSubCategories } from './category-details/healthData';
import { financeSubCategories } from './category-details/financeData';
import { communicationSubCategories } from './category-details/communicationData';
import { transportationSubCategories } from './category-details/transportationData';
import { entertainmentSubCategories } from './category-details/entertainmentData';
import { memoriesSubCategories } from './category-details/memoriesData';
import { securityPrivacySubCategories } from './category-details/securityPrivacyData';
import { computersSubCategories } from './category-details/computersData';
import { learningSubCategories } from './category-details/learningData';
import { servicesSubCategories } from './category-details/servicesData';
import { maintenanceSubCategories } from './category-details/maintenanceData';
import { homeSubCategories } from './category-details/homeData';
import { foodSubCategories } from './category-details/foodData';


export const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const allCategories: MainCategory[] = [
    // 1. Health
    {
      id: 'cat-health',
      text: 'בריאות ורפואה',
      icon: HeartIcon,
      colorClasses: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-500', hoverBorder: 'hover:border-red-400' },
      subCategories: healthSubCategories,
    },
    // 2. Finance
    {
      id: 'cat-finance',
      text: 'כספים ובנקאות',
      icon: BankIcon,
      colorClasses: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-500', hoverBorder: 'hover:border-green-400' },
      subCategories: financeSubCategories,
    },
    // 3. Communication
    {
      id: 'cat-communication',
      text: 'תקשורת וקשרים',
      icon: PhoneIcon,
      colorClasses: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-500', hoverBorder: 'hover:border-blue-400' },
      subCategories: communicationSubCategories,
    },
    // 4. Transportation
    {
      id: 'cat-transportation',
      text: 'תחבורה וניווט',
      icon: MapIcon,
      colorClasses: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-500', hoverBorder: 'hover:border-yellow-400' },
      subCategories: transportationSubCategories,
    },
    // 5. Entertainment
    {
        id: 'cat-entertainment',
        text: 'בידור ופנאי',
        icon: TvIcon,
        colorClasses: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', hoverBorder: 'hover:border-purple-400' },
        subCategories: entertainmentSubCategories,
    },
    // 6. Photos and Memories
    {
      id: 'cat-memories',
      text: 'תמונות וזיכרונות',
      icon: CameraIcon,
      colorClasses: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600', hoverBorder: 'hover:border-pink-400' },
      subCategories: memoriesSubCategories,
    },
    // 7. Security and Privacy
    {
        id: 'cat-security',
        text: 'ביטחון ופרטיות',
        icon: ShieldIcon,
        colorClasses: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', hoverBorder: 'hover:border-gray-400' },
        subCategories: securityPrivacySubCategories,
    },
    // 8. Computers
    {
      id: 'cat-computers',
      text: 'מחשבים ואינטרנט',
      icon: MonitorIcon,
      colorClasses: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-600', hoverBorder: 'hover:border-sky-400' },
      subCategories: computersSubCategories,
    },
    // 9. Learning and Development
    {
      id: 'cat-learning',
      text: 'למידה והתפתחות',
      icon: BookOpenIcon,
      colorClasses: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', hoverBorder: 'hover:border-orange-400' },
      subCategories: learningSubCategories,
    },
    // 10. Services
    {
        id: 'cat-services',
        text: 'שירותים וקהילה',
        icon: WrenchScrewdriverIcon,
        colorClasses: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600', hoverBorder: 'hover:border-teal-400' },
        subCategories: servicesSubCategories,
    },
    // 11. Maintenance
    {
        id: 'cat-maintenance',
        text: 'שירותים ותחזוקה',
        icon: CogIcon,
        colorClasses: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600', hoverBorder: 'hover:border-cyan-400' },
        subCategories: maintenanceSubCategories,
    },
    // 12. Home and Family
    {
        id: 'cat-home',
        text: 'בית ומשפחה',
        icon: HomeIcon,
        colorClasses: { bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-600', hoverBorder: 'hover:border-lime-400' },
        subCategories: homeSubCategories,
    },
    // 13. Food and Nutrition
    {
        id: 'cat-food',
        text: 'אוכל ותזונה',
        icon: BookmarkIcon,
        colorClasses: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', hoverBorder: 'hover:border-indigo-400' },
        subCategories: foodSubCategories,
    },
];

export const getInitialCategories = (): MainCategory[] => {
    // A safe clone that preserves function references for icons
    return allCategories.map(category => ({
        ...category,
        icon: category.icon, // ensure icon is a function reference
        subCategories: category.subCategories.map(sub => ({
            ...sub,
            questions: [...sub.questions]
        }))
    }));
};