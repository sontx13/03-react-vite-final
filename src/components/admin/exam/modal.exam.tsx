import { CheckSquareOutlined, LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { FooterToolbar, ModalForm, ProCard, ProForm, ProFormDigit, ProFormSwitch, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { Col, ConfigProvider, Form, Modal, Row, Upload, message, notification } from "antd";
import 'styles/reset.scss';
import { isMobile } from 'react-device-detect';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useEffect, useState } from "react";
import { callCreateExam, callFetchCompany, callUpdateExam, callUploadSingleFile } from "@/config/api";
import { IExam } from "@/types/backend";
import { v4 as uuidv4 } from 'uuid';
import enUS from 'antd/lib/locale/en_US';
import { DebounceSelect } from "../user/debouce.select";
import { ICompanySelect } from "../user/modal.user";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: IExam | null;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
}

interface IExamForm {
    name: string;
    level: number;
    active: boolean;
}

interface IExamLogo {
    name: string;
    uid: string;
}

const ModalExam = (props: IProps) => {
    const [companies, setCompanies] = useState<ICompanySelect[]>([]);
    const { openModal, setOpenModal, reloadTable, dataInit, setDataInit } = props;

    //modal animation
    const [animation, setAnimation] = useState<string>('open');

    const [loadingUpload, setLoadingUpload] = useState<boolean>(false);
    const [dataLogo, setDataLogo] = useState<IExamLogo[]>([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');
   

    const [value, setValue] = useState<string>("");
    const [form] = Form.useForm();

    useEffect(() => {
        if (dataInit?.logo) {
            setDataLogo([{
              name: dataInit.logo,
              uid: uuidv4()
            }])
          }
        if (dataInit?.id && dataInit?.description) {
            setValue(dataInit.description);
        }
    }, [dataInit])

     // Usage of DebounceSelect
        async function fetchCompanyList(name: string): Promise<ICompanySelect[]> {
            const res = await callFetchCompany(`page=1&size=100&name ~ '${name}'`);
            if (res && res.data) {
                const list = res.data.result;
                const temp = list.map(item => {
                    return {
                        label: item.name as string,
                        value: `${item.id}@#$${item.logo}` as string
                    }
                })
                return temp;
            } else return [];
        }

    const submitExam = async (valuesForm: any) => {
        const { name, level,active } = valuesForm;
        const cp = valuesForm?.company?.value?.split('@#$');

        if (dataLogo.length === 0) {
            message.error('Vui lòng upload ảnh Logo')
            return;
        }

        if (dataInit?.id) {
    
            //update
             const exam = {
                name, level, 
                logo:dataLogo[0].name,
                description: value, 
                company: {
                    id: cp && cp.length > 0 ? cp[0] : "",
                    name: valuesForm.company.label,
                    logo: cp && cp.length > 1 ? cp[1] : ""
                },
                active
            }
            const res = await callUpdateExam(exam, dataInit.id);
            if (res.data) {
                message.success("Cập nhật Exam thành công");
                handleReset();
                reloadTable();
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message
                });
            }
        } else {
             //create
             const exam = {
                name, 
                level, 
                value, 
                logo:dataLogo[0].name,
                description: value, 
                company: {
                    id: cp && cp.length > 0 ? cp[0] : "",
                    name: valuesForm.company.label,
                    logo: cp && cp.length > 1 ? cp[1] : ""
                },
                active
            }
            //create
            const res = await callCreateExam(exam);
            if (res.data) {
                message.success("Thêm mới Exam thành công");
                handleReset();
                reloadTable();
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message
                });
            }
        }
    }

    const handleReset = async () => {
        form.resetFields();
        setValue("");
        setDataInit(null);

        //add animation when closing modal
        setAnimation('close')
        await new Promise(r => setTimeout(r, 400))
        setOpenModal(false);
        setAnimation('open')
    }

    const handleRemoveFile = (file: any) => {
        setDataLogo([])
    }

    const handlePreview = async (file: any) => {
        if (!file.originFileObj) {
            setPreviewImage(file.url);
            setPreviewOpen(true);
            setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
            return;
        }
        getBase64(file.originFileObj, (url: string) => {
            setPreviewImage(url);
            setPreviewOpen(true);
            setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
        });
    };

    const getBase64 = (img: any, callback: any) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => callback(reader.result));
        reader.readAsDataURL(img);
    };

    const beforeUpload = (file: any) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('You can only upload JPG/PNG file!');
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Image must smaller than 2MB!');
        }
        return isJpgOrPng && isLt2M;
    };

    const handleChange = (info: any) => {
        if (info.file.status === 'uploading') {
            setLoadingUpload(true);
        }
        if (info.file.status === 'done') {
            setLoadingUpload(false);
        }
        if (info.file.status === 'error') {
            setLoadingUpload(false);
            message.error(info?.file?.error?.event?.message ?? "Đã có lỗi xảy ra khi upload file.")
        }
    };

    const handleUploadFileLogo = async ({ file, onSuccess, onError }: any) => {
        const res = await callUploadSingleFile(file, "Exam");
        if (res && res.data) {
            setDataLogo([{
                name: res.data.fileName,
                uid: uuidv4()
            }])
            if (onSuccess) onSuccess('ok')
        } else {
            if (onError) {
                setDataLogo([])
                const error = new Error(res.message);
                onError({ event: error });
            }
        }
    };


    return (
        <>
            {openModal &&
                <>
                    <ModalForm
                        title={<>{dataInit?.id ? "Cập nhật bài thi" : "Tạo mới bài thi"}</>}
                        open={openModal}
                        modalProps={{
                            onCancel: () => { handleReset() },
                            afterClose: () => handleReset(),
                            destroyOnClose: true,
                            width: isMobile ? "100%" : 900,
                            footer: null,
                            keyboard: false,
                            maskClosable: false,
                            className: `modal-Exam ${animation}`,
                            rootClassName: `modal-Exam-root ${animation}`
                        }}
                        scrollToFirstError={true}
                        preserve={false}
                        form={form}
                        onFinish={submitExam}
                        initialValues={dataInit?.id ? dataInit : {}}
                        submitter={{
                            render: (_: any, dom: any) => <FooterToolbar>{dom}</FooterToolbar>,
                            submitButtonProps: {
                                icon: <CheckSquareOutlined />
                            },
                            searchConfig: {
                                resetText: "Hủy",
                                submitText: <>{dataInit?.id ? "Cập nhật" : "Tạo mới"}</>,
                            }
                        }}
                    >
                        <Row gutter={16}>
                            <Col span={24}>
                                <ProFormText
                                    label="Tên bài thi"
                                    name="name"
                                    rules={[{ required: true, message: 'Vui lòng không bỏ trống' }]}
                                    placeholder="Nhập tên bài thi"
                                />
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    labelCol={{ span: 24 }}
                                    label="Ảnh Logo"
                                    name="logo"
                                >
                                    <ConfigProvider locale={enUS}>
                                        <Upload
                                            name="logo"
                                            listType="picture-card"
                                            className="avatar-uploader"
                                            maxCount={1}
                                            multiple={false}
                                            customRequest={handleUploadFileLogo}
                                            beforeUpload={beforeUpload}
                                            onChange={handleChange}
                                            onRemove={(file) => handleRemoveFile(file)}
                                            onPreview={handlePreview}
                                            defaultFileList={
                                                dataInit?.id ?
                                                    [
                                                        {
                                                            uid: uuidv4(),
                                                            name: dataInit?.logo ?? "",
                                                            status: 'done',
                                                            url: `${import.meta.env.VITE_BACKEND_URL}/storage/Exam/${dataInit?.logo}`,
                                                        }
                                                    ] : []
                                            }

                                        >
                                            <div>
                                                {loadingUpload ? <LoadingOutlined /> : <PlusOutlined />}
                                                <div style={{ marginTop: 8 }}>Upload</div>
                                            </div>
                                        </Upload>
                                    </ConfigProvider>
                                </Form.Item>

                            </Col>

                            <Col span={4}>
                                <ProFormDigit
                                    label="Cấp độ"
                                    name="level"
                                    rules={[{ required: true, message: 'Vui lòng không bỏ trống' }]}
                                    placeholder="Nhập cấp độ"
                                />
                            </Col>

                             <Col span={4}>
                                <ProFormSwitch
                                    label="Trạng thái"
                                    name="active"
                                    checkedChildren="ACTIVE"
                                    unCheckedChildren="INACTIVE"
                                    initialValue={true}
                                    fieldProps={{
                                        defaultChecked: true,
                                    }}
                                />
                            </Col>

                            
                            <Col span={8}>
                                <ProForm.Item
                                    name="company"
                                    label="Thuộc Công Ty"
                                    rules={[{ required: true, message: 'Vui lòng chọn company!' }]}
                                >
                                    <DebounceSelect
                                        allowClear
                                        showSearch
                                        defaultValue={companies}
                                        value={companies}
                                        placeholder="Chọn công ty"
                                        fetchOptions={fetchCompanyList}
                                        onChange={(newValue: any) => {
                                            if (newValue?.length === 0 || newValue?.length === 1) {
                                                setCompanies(newValue as ICompanySelect[]);
                                            }
                                        }}
                                        style={{ width: '100%' }}
                                    />
                                </ProForm.Item>

                            </Col>
                            

                            <ProCard
                                title="Miêu tả"
                                // subTitle="mô tả công ty"
                                headStyle={{ color: '#d81921' }}
                                style={{ marginBottom: 20 }}
                                headerBordered
                                size="small"
                                bordered
                            >
                                <Col span={24}>
                                    <ReactQuill
                                        theme="snow"
                                        value={value}
                                        onChange={setValue}
                                    />
                                </Col>
                            </ProCard>
                        </Row>
                    </ModalForm>
                    <Modal
                        open={previewOpen}
                        title={previewTitle}
                        footer={null}
                        onCancel={() => setPreviewOpen(false)}
                        style={{ zIndex: 1500 }}
                    >
                        <img alt="example" style={{ width: '100%' }} src={previewImage} />
                    </Modal>
                </>
            }
        </>
    )
}

export default ModalExam;
