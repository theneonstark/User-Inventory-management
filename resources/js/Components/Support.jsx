"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { submitSupport, submitSupportRequest } from "@/lib/Services/SubmitSupport";

export default function SupportForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    priority: "medium",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [supportRequests, setSupportRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Fetch support requests on component mount
  useEffect(() => {
    const fetchSupportRequests = async () => {
      try {
        const response = await submitSupport();
        if (response.success) {
          setSupportRequests(response.data);
        } else {
          console.error("Failed to fetch support requests:", response.message);
        }
      } catch (error) {
        console.error("Error fetching support requests:", error);
      }
    };

    fetchSupportRequests();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriorityChange = (value) => {
    setFormData((prev) => ({ ...prev, priority: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await submitSupportRequest(formData);

      if (response.success) {
        setSubmitStatus({ type: "success", message: "Support request submitted successfully!" });
        setFormData({
          name: "",
          email: "",
          subject: "",
          priority: "medium",
          message: "",
        });
        const updatedRequests = await submitSupport();
        if (updatedRequests.success) {
          setSupportRequests(updatedRequests.data);
        }
      } else {
        throw new Error(response.message || "Failed to submit support request");
      }
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: error.message || "Failed to submit support request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="container mx-auto mt-8 px-4 sm:px-6 lg:px-8 min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Support Form */}
        <Card className="w-full shadow-2xl rounded-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Contact Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-full"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-full"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                  Subject
                </Label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-full"
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                  Priority
                </Label>
                <Select value={formData.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger id="priority" className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                  Message
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-full"
                  rows={6}
                  placeholder="Describe your problem in detail..."
                />
              </div>

              {submitStatus && (
                <div
                  className={cn(
                    "p-3 rounded-lg",
                    submitStatus.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  )}
                >
                  {submitStatus.message}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send size={16} />
                    Submit Request
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Support Requests Table */}
        <Card className="w-full shadow-2xl rounded-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Your Support Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {supportRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No support requests found.</p>
            ) : (
              <div className="w-full overflow-x-auto rounded-lg border">
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left py-3 px-4">ID</TableHead>
                      <TableHead className="text-left py-3 px-4 hidden sm:table-cell">Subject</TableHead>
                      <TableHead className="text-left py-3 px-4">Details</TableHead>
                      <TableHead className="text-left py-3 px-4 hidden md:table-cell">Priority</TableHead>
                      <TableHead className="text-left py-3 px-4 hidden lg:table-cell">Status</TableHead>
                      <TableHead className="text-left py-3 px-4 hidden xl:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supportRequests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-gray-50">
                        <TableCell className="py-3 px-4 font-medium align-middle">{request.id}</TableCell>
                        <TableCell className="py-3 px-4 hidden sm:table-cell align-middle">{request.subject}</TableCell>
                        <TableCell className="py-3 px-4 align-middle">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="link"
                                size="sm"
                                className="text-indigo-600 hover:text-indigo-900 p-0 h-auto"
                                onClick={() => setSelectedRequest(request)}
                              >
                                View
                              </Button>
                            </DialogTrigger>
                            {selectedRequest && selectedRequest.id === request.id && (
                              <DialogContent className="sm:max-w-md w-full">
                                <DialogHeader>
                                  <DialogTitle>{request.subject}</DialogTitle>
                                  <DialogDescription>
                                    Support request details
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Name</p>
                                    <p className="text-sm text-gray-900">{request.name}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Email</p>
                                    <p className="text-sm text-gray-900">{request.email}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Message</p>
                                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{request.message}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Priority</p>
                                    <p className="text-sm text-gray-900 capitalize">{request.priority}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Status</p>
                                    <p className="text-sm text-gray-900 capitalize">{request.status}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Created</p>
                                    <p className="text-sm text-gray-900">{formatDate(request.created_at)}</p>
                                  </div>
                                </div>
                              </DialogContent>
                            )}
                          </Dialog>
                        </TableCell>
                        <TableCell className="py-3 px-4 hidden md:table-cell align-middle capitalize">
                          {request.priority}
                        </TableCell>
                        <TableCell className="py-3 px-4 hidden lg:table-cell align-middle capitalize">
                          {request.status}
                        </TableCell>
                        <TableCell className="py-3 px-4 hidden xl:table-cell align-middle">
                          {formatDate(request.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}