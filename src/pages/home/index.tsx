import { Divider } from 'antd';
import styles from 'styles/client.module.scss';
import SearchClient from '@/components/client/search.client';
import JobCard from '@/components/client/card/job.card';
import CompanyCard from '@/components/client/card/company.card';
import ExamCard from '@/components/client/card/exam.card';

const HomePage = () => {
    return (
        <div className={`${styles["container"]} ${styles["home-section"]}`}>
            <div className="search-content" style={{ marginTop: 20 }}>
                <SearchClient />
            </div>
            <Divider />
            <ExamCard />
            <Divider />
            <CompanyCard />
            <div style={{ margin: 50 }}></div>
            
           
        </div>
    )
}

export default HomePage;