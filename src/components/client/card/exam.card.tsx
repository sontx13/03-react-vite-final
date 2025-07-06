import { callFetchExam } from '@/config/api';
import { convertSlug, getLocationName } from '@/config/utils';
import { IExam } from '@/types/backend';
import { EnvironmentOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Card, Col, Empty, Pagination, Row, Spin } from 'antd';
import { useState, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import styles from 'styles/client.module.scss';
import { sfIn } from "spring-filter-query-builder";

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);


interface IProps {
    showPagination?: boolean;
}

const ExamCard = (props: IProps) => {
    const { showPagination = false } = props;

    const [displayExam, setDisplayExam] = useState<IExam[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(6);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState("");
    const [sortQuery, setSortQuery] = useState("sort=updatedAt,desc");
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();

    useEffect(() => {
        fetchExam();
    }, [current, pageSize, filter, sortQuery, location]);

    const fetchExam = async () => {
        setIsLoading(true)
        let query = `page=${current}&size=${pageSize}`;
        if (filter) {
            query += `&${filter}`;
        }
        if (sortQuery) {
            query += `&${sortQuery}`;
        }

        //check query string
        // const queryLocation = searchParams.get("location");
        // const querySkills = searchParams.get("skills")
        // if (queryLocation || querySkills) {
        //     let q = "";
        //     if (queryLocation) {
        //         q = sfIn("location", queryLocation.split(",")).toString();
        //     }

        //     if (querySkills) {
        //         q = queryLocation ?
        //             q + " and " + `${sfIn("skills", querySkills.split(","))}`
        //             : `${sfIn("skills", querySkills.split(","))}`;
        //     }

        //     query += `&filter=${encodeURIComponent(q)}`;
        // }

        const res = await callFetchExam(query);
        if (res && res.data) {
            setDisplayExam(res.data.result);
            setTotal(res.data.meta.total)
        }
        setIsLoading(false);
    }



    const handleOnchangePage = (pagination: { current: number, pageSize: number }) => {
        if (pagination && pagination.current !== current) {
            setCurrent(pagination.current)
        }
        if (pagination && pagination.pageSize !== pageSize) {
            setPageSize(pagination.pageSize)
            setCurrent(1);
        }
    }

    const handleViewDetailExam = (item: IExam) => {
        const slug = convertSlug(item.name);
        navigate(`/exam/${slug}?id=${item.id}`)
    }

    return (
        <div className={`${styles["card-exam-section"]}`}>
            <div className={`${styles["exam-content"]}`}>
                <Spin spinning={isLoading} tip="Loading...">
                    <Row gutter={[20, 20]}>
                        <Col span={24}>
                            <div className={isMobile ? styles["dflex-mobile"] : styles["dflex-pc"]}>
                                <span className={styles["title"]}>Cuộc thi mới nhất</span>
                                {!showPagination &&
                                    <Link to="exam">Xem tất cả</Link>
                                }
                            </div>
                        </Col>

                        {displayExam?.map(item => {
                            return (
                                <Col span={24} sm={12} md={8} lg={6} key={item.id}>
                                    <Card size="small" title={null} hoverable
                                        onClick={() => handleViewDetailExam(item)}
                                    >
                                        <div className={styles["card-exam-content"]}>
                                            <div className={styles["card-exam-left"]}>
                                                <img
                                                    alt="example"
                                                    src={`${import.meta.env.VITE_BACKEND_URL}/storage/exam/${item?.logo}`}
                                                    style={{ width: "100%", height: "150px", objectFit: "cover" }}
                                                />
                                            </div>
                                            <div className={styles["card-exam-right"]}>
                                                <div className={styles["exam-title"]}>{item.name}</div>
                                                <div className={styles["exam-location"]}><EnvironmentOutlined style={{ color: '#58aaab' }} />&nbsp;{"Cấp độ: "+item.level}</div>
                                                <div><ThunderboltOutlined style={{ color: 'orange' }} />&nbsp;{("Thời gian: "+item.time_minutes + " phút")?.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} </div>
                                                {/* <div className={styles["exam-updatedAt"]}>{item.updatedAt ? dayjs(item.updatedAt).locale('en').fromNow() : dayjs(item.createdAt).locale('en').fromNow()}</div> */}
                                            </div>
                                        </div>

                                    </Card>
                                </Col>
                            )
                        })}


                        {(!displayExam || displayExam && displayExam.length === 0)
                            && !isLoading &&
                            <div className={styles["empty"]}>
                                <Empty description="Không có dữ liệu" />
                            </div>
                        }
                    </Row>
                    {showPagination && <>
                        <div style={{ marginTop: 30 }}></div>
                        <Row style={{ display: "flex", justifyContent: "center" }}>
                            <Pagination
                                current={current}
                                total={total}
                                pageSize={pageSize}
                                responsive
                                onChange={(p: number, s: number) => handleOnchangePage({ current: p, pageSize: s })}
                            />
                        </Row>
                    </>}
                </Spin>
            </div>
        </div>
    )
}

export default ExamCard;