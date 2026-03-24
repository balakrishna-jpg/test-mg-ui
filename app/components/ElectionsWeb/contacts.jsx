// app/components/ElectionsWeb/contacts.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import { Plus, Upload as UploadIcon, Loader2 } from "lucide-react";
import { message, Table, Button, Modal, Input, Space, Upload, Tooltip } from "antd";
import { UploadOutlined, EyeOutlined } from "@ant-design/icons";

import {
  createContactGroup,
  createContactsFromCSV,

  getContactGroups
} from "~/api";



export default function Contacts() {
  const navigate = useNavigate();
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCreateContactsFromCSVModal, setShowCreateContactsFromCSVModal] = useState(false);
  const [showGetGroupContactsModal, setShowGetGroupContactsModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [file, setFile] = useState(null);
  const [nameColumn, setNameColumn] = useState("");
  const [phoneNumberColumn, setPhoneNumberColumn] = useState("");
  const [groupId, setGroupId] = useState("");
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [uploadingContacts, setUploadingContacts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [groups, setGroups] = useState([]);
  const [csvColumns, setCsvColumns] = useState([]);
  const [previewData, setPreviewData] = useState([]);



  const userData = JSON.parse(localStorage.getItem("user_info") || "{}");
  const partyId = userData.party_id;







  const getAllGroups = async () => {
    setLoading(true);
    try {
      const response = await getContactGroups();
      // Response is an array of group objects
      setGroups(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Error fetching groups:", error);
      message.error("Failed to fetch contact groups");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      message.error("Please enter a group name");
      return;
    }

    setCreatingGroup(true);
    try {
      await createContactGroup({
        group_name: groupName
      });
      message.success("Group created successfully");
      setShowCreateGroupModal(false);
      setGroupName("");
      getAllGroups();
    } catch (error) {
      console.error("Error creating group:", error);
      message.error(error?.message || "Failed to create group");
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleCancelCreateGroup = () => {
    setShowCreateGroupModal(false);
    setGroupName("");
  };

  const handleOpenCSVModal = (record) => {
    // Use group_id from the record (backend expects group_id, not id)
    const idToUse = record.group_id || record.id;

    setGroupId(idToUse);
    setShowCreateContactsFromCSVModal(true);
    // Reset CSV-related state when opening modal
    setFile(null);
    setCsvColumns([]);
    setPreviewData([]);
    setNameColumn("");
    setPhoneNumberColumn("");
  };

  const handleFileChange = (file) => {
    if (!file) return;
    setFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0).slice(0, 5);
      
      if (lines.length > 0) {
        // Parse CSV headers - handle quoted values and commas
        const headers = lines[0]
          .split(',')
          .map(h => h.trim().replace(/^"|"$/g, '').replace(/\r/g, ''));
        
        setCsvColumns(headers);
        
        // Auto-select first column as name and try to find phone/mobile column
        if (headers.length > 0) {
          setNameColumn(headers[0]);
        }
        
        // Try to auto-detect phone number column
        const phoneKeywords = ['phone', 'mobile', 'number', 'contact', 'tel'];
        const phoneColumn = headers.find(h => 
          phoneKeywords.some(keyword => h.toLowerCase().includes(keyword))
        );
        if (phoneColumn) {
          setPhoneNumberColumn(phoneColumn);
        } else if (headers.length > 1) {
          setPhoneNumberColumn(headers[1]);
        }

        // Create preview data
        const preview = lines.slice(1, 4).map(line => {
          const values = line
            .split(',')
            .map(v => v.trim().replace(/^"|"$/g, '').replace(/\r/g, ''));
          return Object.fromEntries(headers.map((h, i) => [h, values[i] || ""]));
        });
        setPreviewData(preview);
      }
    };
    reader.readAsText(file);
    return false; // Prevent auto upload
  };

  const handleUploadContacts = async () => {
    if (!file) {
      message.error("Please upload a CSV file");
      return;
    }

    if (!nameColumn.trim()) {
      message.error("Please select the name column");
      return;
    }

    if (!phoneNumberColumn.trim()) {
      message.error("Please select the phone number column");
      return;
    }

    if (!groupId) {
      message.error("Group ID is missing");
      return;
    }

    setUploadingContacts(true);
    try {
      // Ensure group_id is a string
      const groupIdString = String(groupId);


      await createContactsFromCSV({
        file: file,
        name_column: nameColumn,
        phone_number_column: phoneNumberColumn,
        group_id: groupIdString
      });
      message.success("Contacts uploaded successfully");
      setShowCreateContactsFromCSVModal(false);
      setFile(null);
      setNameColumn("");
      setPhoneNumberColumn("");
      setGroupId("");
      getAllGroups(); // Refresh the groups list to update contact counts
    } catch (error) {
      console.error("Error uploading contacts:", error);
      const errorMessage = error?.detail || error?.message || "Failed to upload contacts";
      message.error(errorMessage);
      // If it's the "Group not found" error, log the group_id for debugging
      if (errorMessage.includes("Group not found")) {
        console.error("Group ID that was sent:", groupIdString);
        console.error("Available groups:", groups);
      }
    } finally {
      setUploadingContacts(false);
    }
  };

  const handleCancelCSVModal = () => {
    setShowCreateContactsFromCSVModal(false);
    setFile(null);
    setCsvColumns([]);
    setPreviewData([]);
    setNameColumn("");
    setPhoneNumberColumn("");
    setGroupId("");
  };


  const columns = [
    {
      title: "Community Name",
      dataIndex: "group_name",
      key: "group_name",
    },
    {
      title: "Contact Count",
      dataIndex: "contact_count",
      key: "contact_count",
      render: (count) => {
        // Ensure 0 is displayed, handle null/undefined
        const displayCount = count !== null && count !== undefined ? count : 0;
        return <span style={{ textAlign: 'center', marginLeft: '25px' }}>{displayCount}</span>;
      },
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => date ? new Date(date).toLocaleDateString() : "-",
    },
    {
      title: "Actions",
      dataIndex: "actions",
      key: "actions",
      render: (_, record) => (
        <>
          <Tooltip title="Add from CSV">
            <Button
              type="default"
              icon={<UploadOutlined />}
              onClick={() => handleOpenCSVModal(record)}
              style={{ marginRight: 8 }}
              className="bg-white text-black border border-gray-300 
               hover:!bg-black hover:!text-white hover:!border-purple-600
               active:!bg-purple-600 focus:!bg-purple-600"
            />
          </Tooltip>


          <Tooltip title="View Contacts">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              style={{ marginRight: 8 }}

              className="bg-white text-black border border-gray-300 
                hover:!bg-black hover:!text-white hover:!border-purple-600
                active:!bg-purple-600 focus:!bg-purple-600"

              onClick={() => {
                const idToUse = record.group_id || record.id;
                navigate(`/elections/newcontacts?group_id=${idToUse}`);
              }}
            />
          </Tooltip>
        </>
      ),
    }

  ];

  useEffect(() => {
    getAllGroups();
  }, []);

  return (
    <div className="p-6 ">


      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black dark:text-white text-center">Communities</h1>
        <Button
          type="default"
          icon={<Plus size={16} />}
          onClick={() => setShowCreateGroupModal(true)}
          className="w-full justify-center rounded-3xl bg-black text-white dark:bg-white dark:text-black px-4 py-2 font-medium 
             sm:w-auto sm:justify-normal flex items-center gap-2 
             border-none  hover:!bg-black hover:!text-white hover:!border-purple-600"
        >
          Create Community
        </Button>

      </div>

      <Modal
        title=""
        open={showCreateGroupModal}
        onCancel={handleCancelCreateGroup}
        onOk={handleCreateGroup}
        confirmLoading={creatingGroup}
        okText="Create"
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <label className="block mb-2">Community Name</label>
            <Input
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
        </Space>
      </Modal>

      <Modal

        open={showCreateContactsFromCSVModal}
        onCancel={handleCancelCSVModal}
        onOk={handleUploadContacts}
        confirmLoading={uploadingContacts}
        okText="Upload"
        width={700}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <label className="block mb-2 text-sm font-medium">Upload CSV File</label>
            <Upload
              accept=".csv"
              beforeUpload={handleFileChange}
              fileList={file ? [{
                uid: '-1',
                name: file.name,
                status: 'done',
              }] : []}
              onRemove={() => {
                setFile(null);
                setCsvColumns([]);
                setPreviewData([]);
                setNameColumn("");
                setPhoneNumberColumn("");
                return true;
              }}
              maxCount={1}
            >
              <Button icon={<UploadIcon size={16} />}>Select CSV File</Button>
            </Upload>
            <p className="text-sm text-gray-500 mt-2">
              Please upload a CSV file with name and phone number columns
            </p>
          </div>

          {csvColumns.length > 0 && (
            <>
              <div>
                <label className="block mb-2 text-sm font-medium">Name Column *</label>
                <select
                  value={nameColumn}
                  onChange={(e) => setNameColumn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#3d3d3d] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-[#ececf1]"
                >
                  <option value="">Select name column...</option>
                  {csvColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Select the column containing contact names
                </p>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Phone Number Column *</label>
                <select
                  value={phoneNumberColumn}
                  onChange={(e) => setPhoneNumberColumn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#3d3d3d] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-[#ececf1]"
                >
                  <option value="">Select phone number column...</option>
                  {csvColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Select the column containing phone numbers
                </p>
              </div>
            </>
          )}

          {previewData.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Preview (first 3 rows)</p>
              <div className="overflow-x-auto text-xs border border-gray-200 dark:border-[#3d3d3d] rounded-lg">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-[#1f1f1f]">
                    <tr>
                      {csvColumns.map(header => (
                        <th key={header} className="px-3 py-2 text-left font-medium text-gray-700 dark:text-[#d1d5db] border-b border-gray-200 dark:border-[#3d3d3d]">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-[#2d2d2d]">
                    {previewData.map((row, i) => (
                      <tr key={i} className="border-b border-gray-200 dark:border-[#3d3d3d]">
                        {csvColumns.map(header => (
                          <td key={header} className="px-3 py-2 text-gray-900 dark:text-[#ececf1]">
                            {row[header] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Space>
      </Modal>

      <Table
        columns={columns}
        dataSource={groups}
        loading={loading}
        rowKey={(record) => record.group_id || record.id || record._id}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: groups.length,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} groups`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
        }}
      />
    </div>
  );
}