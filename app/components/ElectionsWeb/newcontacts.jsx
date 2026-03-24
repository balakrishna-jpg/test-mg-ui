// app/components/ElectionsWeb/newcontacts.jsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useParams } from "@remix-run/react";
import { ArrowLeft, Plus } from "lucide-react";
import { message, Table, Button, Modal, Input, Space } from "antd";
import { getGroupContacts, createContactManually, deleteGroupContacts } from "~/api";

export default function AllContacts() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const groupId = searchParams.get("group_id");

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [groupName, setGroupName] = useState("");
  const [showCreateContactModal, setShowCreateContactModal] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);
  const [contactName, setContactName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchContacts = async (page = 1, size = 10) => {
    if (!groupId) {
      message.error("Group ID is missing");
      return;
    }

    setLoading(true);
    try {
      const response = await getGroupContacts({
        groupId: groupId,
        page: page,
        page_size: size,
      });



      // Handle the API response structure: { contacts: [], total: number, group_id: string, group_name: string | null }
      if (response && response.contacts) {
        setContacts(response.contacts || []);
        setTotal(response.total || 0);
        if (response.group_name) {
          setGroupName(response.group_name);
        }
      } else if (response && Array.isArray(response)) {
        // Fallback: if response is directly an array
        setContacts(response);
        setTotal(response.length);
      } else if (response && response.results) {
        // Fallback: if response has pagination structure { results: [], total: number }
        setContacts(response.results || []);
        setTotal(response.total || response.count || 0);
        if (response.group_name) {
          setGroupName(response.group_name);
        }
      } else {
        setContacts([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      message.warning(error?.detail || error?.message || "Failed to fetch contacts");
      setContacts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchContacts(currentPage, pageSize);
    } else {
      message.warning("No group ID provided");
    }
  }, [groupId, currentPage, pageSize]);

  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
    fetchContacts(page, size);
  };

  const handleCreateContact = async () => {
    if (!contactName.trim()) {
      message.error("Please enter a name");
      return;
    }

    if (!mobileNumber.trim()) {
      message.error("Please enter a mobile number");
      return;
    }

    // Basic mobile number validation (10-15 digits)
    const mobileRegex = /^[0-9]{10,15}$/;
    if (!mobileRegex.test(mobileNumber.replace(/\D/g, ""))) {
      message.error("Please enter a valid mobile number (10-15 digits)");
      return;
    }

    setCreatingContact(true);
    try {
      await createContactManually({
        group_id: groupId,
        name: contactName.trim(),
        mobile_number: mobileNumber.replace(/\D/g, ""), // Remove non-digits
        is_group: false,
      });
      message.success("Contact created successfully");
      setShowCreateContactModal(false);
      setContactName("");
      setMobileNumber("");

      // Refresh the contacts list
      fetchContacts(currentPage, pageSize);
    } catch (error) {
      console.error("Error creating contact:", error);
      message.error(error?.detail || error?.message || "Failed to create contact");
    } finally {
      setCreatingContact(false);
    }
  };

  const handleCancelCreateContact = () => {
    setShowCreateContactModal(false);
    setContactName("");
    setMobileNumber("");

  };

  const handleDeleteContacts = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select contacts to delete");
      return;
    }

    setDeleting(true);
    try {
      // Get mobile numbers from selected contacts
      const mobileNumbers = contacts
        .filter(contact => {
          const contactId = contact.id || contact._id || contact.contact_id;
          return selectedRowKeys.includes(contactId);
        })
        .map(contact => contact.mobile_number)
        .filter(phone => phone && phone.trim().length > 0); // Filter out any undefined/null/empty values

      if (mobileNumbers.length === 0) {
        message.error("No valid mobile numbers found in selected contacts");
        setSelectedRowKeys([]);
        setShowDeleteConfirm(false);
        return;
      }

      await deleteGroupContacts(groupId, mobileNumbers);
      message.success(`Successfully deleted ${mobileNumbers.length} contact(s)`);
      setSelectedRowKeys([]);
      setShowDeleteConfirm(false);
      // Refresh the contacts list
      fetchContacts(currentPage, pageSize);
    } catch (error) {
      console.error("Error deleting contacts:", error);
      message.error(error?.detail || error?.message || "Failed to delete contacts");
    } finally {
      setDeleting(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys);
    },
  };

  const columns = [

    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => text || "-",
    },
    {
      title: "Mobile Number",
      dataIndex: "mobile_number",
      key: "mobile_number",
      render: (text) => text || "-",
    },
    {
      title: "Created at",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => (date ? new Date(date).toLocaleDateString() : "-"),
    },
  ];

  if (!groupId) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate(`/elections/contacts`)}
          >
            Back to Groups
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">No group ID provided. Please select a group first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate(`/elections/contacts`)}
            className="border border-gray-300 rounded-md px-4 py-2
             hover:!border-gray-300 hover:!bg-white hover:!text-inherit
             active:!bg-white focus:!bg-white"
          >
            Back
          </Button>

          <h1 className="text-2xl font-bold text-black text-center italic">
            {groupName && <> {groupName}</>}
          </h1>


        </div>
        <div className="flex items-center gap-2">
          {selectedRowKeys.length > 0 && (
            <Button
              danger
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
            >
              Delete Selected ({selectedRowKeys.length})
            </Button>
          )}
          <Button
            type="default"
            icon={<Plus size={16} />}
            onClick={() => setShowCreateContactModal(true)}
            className="w-full justify-center rounded-md bg-black px-4 py-2 font-medium text-white 
             sm:w-auto sm:justify-normal flex items-center gap-2 
             border-none hover:!bg-black hover:!border-black hover:!text-white"
          >
            Add Manually
          </Button>

        </div>
      </div>

      <Modal
        title="Add Contact Manually"
        open={showCreateContactModal}
        onCancel={handleCancelCreateContact}
        onOk={handleCreateContact}
        confirmLoading={creatingContact}
        okText="Create"
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <label className="block mb-2">Name *</label>
            <Input
              placeholder="Enter contact name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-2">Mobile Number *</label>
            <Input
              placeholder="Enter mobile number 91**********"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              maxLength={15}
            />
            <p className="text-sm text-gray-500 mt-1">
              12 digits
            </p>
          </div>


        </Space>
      </Modal>

      <Modal
        title="Confirm Delete"
        open={showDeleteConfirm}
        onOk={handleDeleteContacts}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmLoading={deleting}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to delete {selectedRowKeys.length} contact(s)? This action cannot be undone.
        </p>
      </Modal>

      <Table
        columns={columns}
        dataSource={contacts}
        loading={loading}
        rowKey={(record) => record.id || record._id || record.contact_id || Math.random()}
        rowSelection={rowSelection}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} contacts`,
          onChange: handlePageChange,
          onShowSizeChange: handlePageChange,
        }}
      />
    </div>
  );
}
