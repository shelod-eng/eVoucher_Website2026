import Layout from "./Layout.jsx";

import AIInsights from "./AIInsights";

import AdminDashboard from "./AdminDashboard";

import AdminReports from "./AdminReports";

import BillingEngine from "./BillingEngine";

import Challenges from "./Challenges";

import Checkout from "./Checkout";

import ConsumerHome from "./ConsumerHome";

import ConsumerWallet from "./ConsumerWallet";

import HelpSupport from "./HelpSupport";

import Home from "./Home";

import ImpactDashboard from "./ImpactDashboard";

import InvestecPresentation from "./InvestecPresentation";

import InvestorPitchDeck from "./InvestorPitchDeck";

import Landing from "./Landing";

import MembershipCard from "./MembershipCard";

import MerchantDashboard from "./MerchantDashboard";

import MerchantOnboarding from "./MerchantOnboarding";

import MerchantOnboardingFlow from "./MerchantOnboardingFlow";

import MerchantPOS from "./MerchantPOS";

import MerchantPortal from "./MerchantPortal";

import MerchantProspectus from "./MerchantProspectus";

import MerchantSignup from "./MerchantSignup";

import MiniCooperReport from "./MiniCooperReport";

import MobileAppPOC from "./MobileAppPOC";

import NotificationSettings from "./NotificationSettings";

import Notifications from "./Notifications";

import PaymentMethods from "./PaymentMethods";

import PrivacySecurity from "./PrivacySecurity";

import Profile from "./Profile";

import Reports from "./Reports";

import Rewards from "./Rewards";

import SMSSimulator from "./SMSSimulator";

import SavingsTracker from "./SavingsTracker";

import SendVoucher from "./SendVoucher";

import Settings from "./Settings";

import SettlementPayouts from "./SettlementPayouts";

import Shop from "./Shop";

import StakeholderFinancialReport from "./StakeholderFinancialReport";

import StakeholderHub from "./StakeholderHub";

import StakeholderReport from "./StakeholderReport";

import StakeholderReportPrint from "./StakeholderReportPrint";

import StakeholderTipping from "./StakeholderTipping";

import SystemArchitecture from "./SystemArchitecture";

import TechSpec from "./TechSpec";

import TechnicalPortfolio from "./TechnicalPortfolio";

import TransactionHistory from "./TransactionHistory";

import USSDSimulator from "./USSDSimulator";

import Wallet from "./Wallet";

import HowWeBuilt from "./HowWeBuilt";

import Website from "./Website";

import MerchantAnalytics from "./MerchantAnalytics";
import Logistics from "./Logistics";
import VoucherLedger from "./VoucherLedger";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import AdminLogin from "./AdminLogin";
import RequireAdmin from "@/components/auth/RequireAdmin";
import AuditLog from "./AuditLog";
import UserRoles from "./UserRoles";
import BankLinkage from "./BankLinkage";
import BankServ from "./BankServ";
import BulkUpload from "./BulkUpload";
import Controls from "./Controls";

const PAGES = {
    
    AIInsights: AIInsights,
    
    AdminDashboard: AdminDashboard,
    
    AdminReports: AdminReports,
    
    BillingEngine: BillingEngine,
    
    Challenges: Challenges,
    
    Checkout: Checkout,
    
    ConsumerHome: ConsumerHome,
    
    ConsumerWallet: ConsumerWallet,
    
    HelpSupport: HelpSupport,
    
    Home: Home,
    
    ImpactDashboard: ImpactDashboard,
    
    InvestecPresentation: InvestecPresentation,
    
    InvestorPitchDeck: InvestorPitchDeck,
    
    Landing: Landing,
    
    MembershipCard: MembershipCard,
    
    MerchantDashboard: MerchantDashboard,
    
    MerchantOnboarding: MerchantOnboarding,
    
    MerchantOnboardingFlow: MerchantOnboardingFlow,
    
    MerchantPOS: MerchantPOS,
    
    MerchantPortal: MerchantPortal,
    
    MerchantProspectus: MerchantProspectus,
    
    MerchantSignup: MerchantSignup,
    
    MiniCooperReport: MiniCooperReport,
    
    MobileAppPOC: MobileAppPOC,
    
    NotificationSettings: NotificationSettings,
    
    Notifications: Notifications,
    
    PaymentMethods: PaymentMethods,
    
    PrivacySecurity: PrivacySecurity,
    
    Profile: Profile,
    
    Reports: Reports,
    
    Rewards: Rewards,
    
    SMSSimulator: SMSSimulator,
    
    SavingsTracker: SavingsTracker,
    
    SendVoucher: SendVoucher,
    
    Settings: Settings,
    
    SettlementPayouts: SettlementPayouts,
    
    Shop: Shop,
    
    StakeholderFinancialReport: StakeholderFinancialReport,
    
    StakeholderHub: StakeholderHub,
    
    StakeholderReport: StakeholderReport,
    
    StakeholderReportPrint: StakeholderReportPrint,
    
    StakeholderTipping: StakeholderTipping,
    
    SystemArchitecture: SystemArchitecture,
    
    TechSpec: TechSpec,
    
    TechnicalPortfolio: TechnicalPortfolio,
    
    TransactionHistory: TransactionHistory,
    
    USSDSimulator: USSDSimulator,
    
    Wallet: Wallet,
    
    HowWeBuilt: HowWeBuilt,
    
    Website: Website,
    
    MerchantAnalytics: MerchantAnalytics,

    Logistics: Logistics,

    VoucherLedger: VoucherLedger,

    AuditLog: AuditLog,

    UserRoles: UserRoles,

    BankLinkage: BankLinkage,

    BankServ: BankServ,

    BulkUpload: BulkUpload,

    Controls: Controls,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/login" element={<AdminLogin />} />

                    <Route
                        path="/"
                        element={
                            <RequireAdmin>
                                <BillingEngine />
                            </RequireAdmin>
                        }
                    />
                
                
                <Route path="/AIInsights" element={<AIInsights />} />
                
                <Route path="/AdminDashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                
                <Route path="/AdminReports" element={<RequireAdmin><AdminReports /></RequireAdmin>} />
                
                <Route path="/BillingEngine" element={<RequireAdmin><BillingEngine /></RequireAdmin>} />
                
                <Route path="/Challenges" element={<Challenges />} />
                
                <Route path="/Checkout" element={<Checkout />} />
                
                <Route path="/ConsumerHome" element={<ConsumerHome />} />
                
                <Route path="/ConsumerWallet" element={<ConsumerWallet />} />
                
                <Route path="/HelpSupport" element={<HelpSupport />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/ImpactDashboard" element={<ImpactDashboard />} />
                
                <Route path="/InvestecPresentation" element={<InvestecPresentation />} />
                
                <Route path="/InvestorPitchDeck" element={<InvestorPitchDeck />} />
                
                <Route path="/Landing" element={<Landing />} />
                
                <Route path="/MembershipCard" element={<MembershipCard />} />
                
                <Route path="/MerchantDashboard" element={<MerchantDashboard />} />
                
                <Route path="/MerchantOnboarding" element={<MerchantOnboarding />} />
                
                <Route path="/MerchantOnboardingFlow" element={<MerchantOnboardingFlow />} />
                
                <Route path="/MerchantPOS" element={<MerchantPOS />} />
                
                <Route path="/MerchantPortal" element={<MerchantPortal />} />
                
                <Route path="/MerchantProspectus" element={<MerchantProspectus />} />
                
                <Route path="/MerchantSignup" element={<MerchantSignup />} />
                
                <Route path="/MiniCooperReport" element={<MiniCooperReport />} />
                
                <Route path="/MobileAppPOC" element={<MobileAppPOC />} />
                
                <Route path="/NotificationSettings" element={<NotificationSettings />} />
                
                <Route path="/Notifications" element={<Notifications />} />
                
                <Route path="/PaymentMethods" element={<PaymentMethods />} />
                
                <Route path="/PrivacySecurity" element={<PrivacySecurity />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/Reports" element={<Reports />} />
                
                <Route path="/Rewards" element={<Rewards />} />
                
                <Route path="/SMSSimulator" element={<SMSSimulator />} />
                
                <Route path="/SavingsTracker" element={<SavingsTracker />} />
                
                <Route path="/SendVoucher" element={<SendVoucher />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/SettlementPayouts" element={<RequireAdmin><SettlementPayouts /></RequireAdmin>} />
                
                <Route path="/Shop" element={<Shop />} />
                
                <Route path="/StakeholderFinancialReport" element={<StakeholderFinancialReport />} />
                
                <Route path="/StakeholderHub" element={<StakeholderHub />} />
                
                <Route path="/StakeholderReport" element={<StakeholderReport />} />
                
                <Route path="/StakeholderReportPrint" element={<StakeholderReportPrint />} />
                
                <Route path="/StakeholderTipping" element={<StakeholderTipping />} />
                
                <Route path="/SystemArchitecture" element={<SystemArchitecture />} />
                
                <Route path="/TechSpec" element={<TechSpec />} />
                
                <Route path="/TechnicalPortfolio" element={<TechnicalPortfolio />} />
                
                <Route path="/TransactionHistory" element={<TransactionHistory />} />
                
                <Route path="/USSDSimulator" element={<USSDSimulator />} />
                
                <Route path="/Wallet" element={<Wallet />} />
                
                <Route path="/HowWeBuilt" element={<HowWeBuilt />} />
                
                <Route path="/Website" element={<Website />} />
                
                <Route path="/MerchantAnalytics" element={<MerchantAnalytics />} />

                <Route path="/Logistics" element={<RequireAdmin><Logistics /></RequireAdmin>} />

                <Route path="/VoucherLedger" element={<RequireAdmin><VoucherLedger /></RequireAdmin>} />

                <Route path="/AuditLog" element={<RequireAdmin><AuditLog /></RequireAdmin>} />

                <Route path="/UserRoles" element={<RequireAdmin><UserRoles /></RequireAdmin>} />

                <Route path="/BankLinkage" element={<RequireAdmin><BankLinkage /></RequireAdmin>} />

                <Route path="/BankServ" element={<RequireAdmin><BankServ /></RequireAdmin>} />

                <Route path="/BulkUpload" element={<RequireAdmin><BulkUpload /></RequireAdmin>} />

                <Route path="/Controls" element={<RequireAdmin><Controls /></RequireAdmin>} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}
