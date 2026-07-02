import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "iGen Student Management API",
    version: "1.0.0",
    description: "Tài liệu API cho Hệ thống Quản lý Đào tạo & Sát hạch học viên lái xe (MongoDB & Cloudinary)",
  },
  servers: [
    {
      url: "/api/v1",
      description: "Local API v1 Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Nhập Access Token được cấp sau khi đăng nhập thành công",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          uid: { type: "string" },
          email: { type: "string" },
          displayName: { type: "string" },
        },
      },
      Student: {
        type: "object",
        properties: {
          id: { type: "string" },
          fullName: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          rank: { type: "string", enum: ["A1", "A2", "B1", "B2", "C"] },
          registrationDate: { type: "string" },
          fee: { type: "string" },
          paidAmount: { type: "number" },
          status: { type: "string" },
          healthCheckDate: { type: "string" },
          healthCheckNotes: { type: "string" },
          healthCheckFiles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                url: { type: "string" },
                type: { type: "string" },
                uploadedAt: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        summary: "Đăng ký tài khoản quản trị mới",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "displayName"],
                properties: {
                  email: { type: "string", example: "admin@igen.vn" },
                  password: { type: "string", example: "123456" },
                  displayName: { type: "string", example: "Nguyễn Văn Admin" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Đăng ký thành công" },
          400: { description: "Dữ liệu không hợp lệ" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Đăng nhập hệ thống",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "admin@igen.vn" },
                  password: { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Đăng nhập thành công, Refresh Token được trả về qua cookie bảo mật" },
          400: { description: "Email hoặc mật khẩu sai" },
        },
      },
    },
    "/auth/refresh-token": {
      post: {
        summary: "Lấy Access Token mới bằng Refresh Token lưu tại cookie",
        tags: ["Auth"],
        responses: {
          200: { description: "Cấp mới Access Token thành công" },
          401: { description: "Refresh Token đã hết hạn hoặc không hợp lệ" },
        },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Đăng xuất khỏi hệ thống",
        tags: ["Auth"],
        responses: {
          200: { description: "Đăng xuất thành công, xóa sạch cookie xác thực" },
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Lấy thông tin tài khoản hiện tại",
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Lấy thông tin thành công" },
          401: { description: "Chưa đăng nhập" },
        },
      },
    },
    "/auth/bank-settings": {
      patch: {
        summary: "Cập nhật tài khoản ngân hàng của admin để đối soát webhook",
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  bankAccountNo: { type: "string", example: "1234567890", description: "Số tài khoản ngân hàng nhận tiền" },
                  bankId: { type: "string", example: "vietcombank", description: "Mã ngân hàng (ví dụ: vietcombank, techcombank...)" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Cập nhật thành công" },
          401: { description: "Chưa đăng nhập" },
          400: { description: "Dữ liệu không hợp lệ" },
        },
      },
    },
    "/students": {
      get: {
        summary: "Lấy danh sách học viên",
        tags: ["Students"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "rank", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Tìm theo tên hoặc số điện thoại" },
        ],
        responses: {
          200: { description: "Thành công" },
        },
      },
      post: {
        summary: "Thêm học viên mới",
        tags: ["Students"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fullName", "phone", "rank", "registrationDate", "fee"],
                properties: {
                  fullName: { type: "string", example: "Nguyễn Văn Học Viên" },
                  phone: { type: "string", example: "0987654321" },
                  email: { type: "string", example: "hocvien@gmail.com" },
                  rank: { type: "string", enum: ["A1", "A2", "B1", "B2", "C"] },
                  registrationDate: { type: "string", example: "12/06/2026" },
                  fee: { type: "string", example: "12.000.000" },
                  address: { type: "string", example: "Hà Nội" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Tạo thành công" },
        },
      },
    },
    "/students/{id}": {
      get: {
        summary: "Lấy chi tiết hồ sơ học viên",
        tags: ["Students"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Thành công" },
          404: { description: "Không tìm thấy học viên" },
        },
      },
      patch: {
        summary: "Cập nhật thông tin học viên",
        tags: ["Students"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          200: { description: "Cập nhật thành công" },
        },
      },
      delete: {
        summary: "Xóa hồ sơ học viên",
        tags: ["Students"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Xóa thành công" },
        },
      },
    },
    "/exams": {
      get: {
        summary: "Lấy danh sách đợt thi",
        tags: ["Exams"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "rank", in: "query", schema: { type: "string" } },
          { name: "area", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Thành công" },
        },
      },
      post: {
        summary: "Tạo đợt thi mới",
        tags: ["Exams"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "status", "rank", "area", "tentativeDate", "location"],
                properties: {
                  name: { type: "string", example: "Đợt thi B2 Tháng 7" },
                  status: { type: "string", enum: ["Sắp diễn ra", "Đã xác nhận", "Đã hoàn thành", "Đã hủy"] },
                  rank: { type: "string", enum: ["A1", "A2", "B1", "B2", "C"] },
                  area: { type: "string", example: "Nội thành" },
                  tentativeDate: { type: "string", example: "15/07/2026" },
                  location: { type: "string", example: "Sân sát hạch Sài Đồng" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Tạo thành công" },
        },
      },
    },
    "/exams/{id}/assign": {
      post: {
        summary: "Thêm học viên vào đợt thi",
        tags: ["Exams"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["studentId"],
                properties: {
                  studentId: { type: "string", example: "648f3b259d64a023fb04e6c1" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Thành công" },
        },
      },
    },
    "/payments": {
      get: {
        summary: "Lấy lịch sử thanh toán",
        tags: ["Payments"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Thành công" } },
      },
      post: {
        summary: "Ghi nhận thanh toán học phí",
        tags: ["Payments"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["studentId", "studentName", "amount", "date"],
                properties: {
                  studentId: { type: "string" },
                  studentName: { type: "string" },
                  amount: { type: "number" },
                  date: { type: "string" },
                  note: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Tạo thành công" } },
      },
    },
    "/students/{id}/installment/{no}/mark-paid": {
      patch: {
        summary: "Đánh dấu đã thu tiền đợt học phí cho học viên",
        tags: ["Students"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId của học viên" },
          { name: "no", in: "path", required: true, schema: { type: "integer", minimum: 1 }, description: "Số thứ tự đợt thu (bắt đầu từ 1)" },
        ],
        responses: {
          200: { description: "Đánh dấu thành công — status đợt chuyển sang 'Đã thu'" },
          400: { description: "Số đợt không hợp lệ hoặc không tìm thấy đợt cho học viên" },
          401: { description: "Chưa đăng nhập" },
          404: { description: "Không tìm thấy học viên" },
        },
      },
    },
    "/notifications": {
      get: {
        summary: "Lấy danh sách lịch sử thông báo đã gửi",
        tags: ["Notifications"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Thành công" } },
      },
      post: {
        summary: "Lưu lịch sử thông báo sau khi gửi hàng loạt",
        tags: ["Notifications"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "content", "recipients", "recipientCount", "channels", "status"],
                properties: {
                  title: { type: "string", example: "THÔNG BÁO HOÀN THÀNH HỌC PHÍ" },
                  content: { type: "string" },
                  recipients: { type: "string", example: "Học viên còn nợ học phí" },
                  recipientCount: { type: "integer" },
                  channels: { type: "array", items: { type: "string" }, example: ["Email"] },
                  status: { type: "string", enum: ["Đã gửi", "Đang gửi", "Thất bại"] },
                  studentIds: { type: "array", items: { type: "string" }, description: "Danh sách ID học viên được gửi (để cập nhật installmentStatus)" },
                  installmentPlan: {
                    type: "object",
                    description: "Thông tin đợt thu học phí (optional — chỉ khi gửi theo đợt)",
                    properties: {
                      installmentNo: { type: "integer", minimum: 1, example: 1 },
                      percent: { type: "number", minimum: 1, maximum: 100, example: 40, description: "% tổng học phí gốc của đợt này" },
                      label: { type: "string", example: "Đợt 1" },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Lưu thành công" },
          400: { description: "Dữ liệu không hợp lệ" },
        },
      },
    },
    "/notifications/{id}": {
      delete: {
        summary: "Xóa một bản ghi lịch sử thông báo",
        tags: ["Notifications"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Xóa thành công" },
          404: { description: "Không tìm thấy" },
        },
      },
    },

    "/upload": {
      post: {
        summary: "Tải file lên Cloudinary",
        tags: ["Upload"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Tải lên thành công, trả về link HTTPS từ Cloudinary" },
        },
      },
    },
    "/ai/analyze": {
      post: {
        summary: "Phân tích hồ sơ và lộ trình học viên bằng mô hình AI Gemini",
        tags: ["AI Advisor"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fullName", "phone", "rank", "registrationDate", "fee", "status"],
                properties: {
                  fullName: { type: "string", example: "Nguyễn Văn Học Viên" },
                  phone: { type: "string", example: "0987654321" },
                  rank: { type: "string", enum: ["A1", "A2", "B1", "B2", "C"] },
                  registrationDate: { type: "string", example: "12/06/2026" },
                  fee: { type: "string", example: "12.000.000" },
                  status: { type: "string", example: "Chờ KSK" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    analysis: { type: "string" },
                  },
                },
              },
            },
          },
          400: { description: "Dữ liệu không hợp lệ" },
          401: { description: "Chưa đăng nhập" },
        },
      },
    },
    "/chatbot/chat": {
      post: {
        summary: "Gửi tin nhắn trò chuyện với chatbot AI qua Gemini",
        tags: ["AI Chatbot"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["messages"],
                properties: {
                  messages: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["role", "content"],
                      properties: {
                        role: { type: "string", enum: ["user", "assistant", "system"], example: "user" },
                        content: { type: "string", example: "Hồ sơ đăng ký học lái xe B2 gồm những gì?" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    reply: { type: "string" },
                  },
                },
              },
            },
          },
          400: { description: "Dữ liệu không hợp lệ" },
          401: { description: "Chưa đăng nhập" },
        },
      },
    },
    "/health": {
      get: {
        summary: "Health Check cho Server & DB",
        tags: ["Health Check"],
        responses: {
          200: { description: "Hệ thống hoạt động bình thường" },
          500: { description: "Mất kết nối Cơ sở dữ liệu" },
        },
      },
    },
    "/webhook/payment": {
      post: {
        summary: "Webhook nhận thông tin thanh toán từ ngân hàng (Casso/SePay)",
        tags: ["Webhook"],
        parameters: [
          { name: "secret", in: "query", schema: { type: "string" }, description: "Secret token dùng để xác thực webhook (nếu không gửi ở header)" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  transferAmount: { type: "number", example: 1500000 },
                  content: { type: "string", example: "Nop hoc phi Nguyen Van A 0987654321" },
                  accountNumber: { type: "string", example: "1234567890" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Ghi nhận giao dịch thành công" },
          401: { description: "Xác thực token thất bại" },
          400: { description: "Lỗi dữ liệu đầu vào hoặc không khớp được học viên" }
        }
      }
    },
    "/events": {
      get: {
        summary: "Kênh Server-Sent Events (SSE) để nhận cập nhật thanh toán thời gian thực",
        tags: ["Realtime"],
        parameters: [
          { name: "token", in: "query", required: true, schema: { type: "string" }, description: "Access Token của admin" }
        ],
        responses: {
          200: { description: "Thiết lập kết nối SSE thành công" },
          401: { description: "Token không hợp lệ hoặc đã hết hạn" }
        }
      }
    },
    "/courses": {
      get: {
        summary: "Danh sách khóa học",
        tags: ["Courses"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "category", in: "query", schema: { type: "string" }, description: "Tên phân loại (quản lý động qua /courses/categories)" },
          { name: "status", in: "query", schema: { type: "string", enum: ["Hoạt động", "Tạm dừng"] } },
          { name: "search", in: "query", schema: { type: "string" } }
        ],
        responses: { 200: { description: "Danh sách khóa học" }, 401: { description: "Chưa xác thực" } }
      },
      post: {
        summary: "Tạo khóa học mới",
        tags: ["Courses"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["code", "title", "category", "fee", "duration"],
                properties: {
                  code: { type: "string", example: "DRV-B2" },
                  title: { type: "string", example: "Học lái xe Ô tô hạng B2" },
                  category: { type: "string", example: "Lái xe" },
                  fee: { type: "string", example: "15.500.000đ" },
                  duration: { type: "string", example: "3.5 tháng" },
                  maxLearners: { type: "number", example: 25 }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Tạo khóa học thành công" }, 400: { description: "Dữ liệu không hợp lệ hoặc trùng mã" } }
      }
    },
    "/courses/{id}": {
      patch: {
        summary: "Cập nhật khóa học",
        tags: ["Courses"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Cập nhật thành công" }, 404: { description: "Không tìm thấy khóa học" } }
      },
      delete: {
        summary: "Xóa khóa học",
        tags: ["Courses"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Xóa thành công" }, 404: { description: "Không tìm thấy khóa học" } }
      }
    },
    "/instructors": {
      get: {
        summary: "Danh sách giảng viên",
        tags: ["Instructors"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["Available", "On Leave", "Busy"] } },
          { name: "search", in: "query", schema: { type: "string" } }
        ],
        responses: { 200: { description: "Danh sách giảng viên" }, 401: { description: "Chưa xác thực" } }
      },
      post: {
        summary: "Tạo hồ sơ giảng viên",
        tags: ["Instructors"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "phone", "email", "specializations"],
                properties: {
                  name: { type: "string", example: "Thầy Hoàng Xuân Cường" },
                  phone: { type: "string", example: "0903111222" },
                  email: { type: "string", example: "cuonghx@igen.vn" },
                  specializations: { type: "array", items: { type: "string" }, example: ["Lý thuyết B2/C"] }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Tạo giảng viên thành công" }, 400: { description: "Dữ liệu không hợp lệ" } }
      }
    },
    "/instructors/{id}": {
      patch: {
        summary: "Cập nhật giảng viên (trạng thái, chuyên môn...)",
        tags: ["Instructors"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Cập nhật thành công" }, 404: { description: "Không tìm thấy giảng viên" } }
      },
      delete: {
        summary: "Xóa giảng viên",
        tags: ["Instructors"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Xóa thành công" }, 404: { description: "Không tìm thấy giảng viên" } }
      }
    },
    "/resources": {
      get: {
        summary: "Danh sách tài nguyên (phòng học, xe tập lái, thiết bị)",
        tags: ["Resources"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "type", in: "query", schema: { type: "string" }, description: "Tên phân loại (quản lý động qua /resources/categories)" },
          { name: "status", in: "query", schema: { type: "string", enum: ["AVAILABLE", "OCCUPIED", "MAINTENANCE"] } }
        ],
        responses: { 200: { description: "Danh sách tài nguyên" }, 401: { description: "Chưa xác thực" } }
      },
      post: {
        summary: "Khai báo tài nguyên mới",
        tags: ["Resources"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "type", "identifier", "capacity"],
                properties: {
                  name: { type: "string", example: "Xe Toyota Vios tập lái số 08" },
                  type: { type: "string", example: "Phương tiện / Xe tập lái" },
                  identifier: { type: "string", example: "30E-666.88" },
                  capacity: { type: "string", example: "1 học viên + 1 GV" }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Khai báo thành công" }, 400: { description: "Dữ liệu không hợp lệ" } }
      }
    },
    "/resources/categories": {
      get: {
        summary: "Danh sách phân loại tài nguyên",
        tags: ["Resources"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Danh sách phân loại" }, 401: { description: "Chưa xác thực" } }
      },
      post: {
        summary: "Tạo phân loại tài nguyên mới",
        tags: ["Resources"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Phòng mô phỏng lái xe" }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Tạo phân loại thành công" }, 400: { description: "Trùng tên phân loại" } }
      }
    },
    "/resources/categories/{id}": {
      delete: {
        summary: "Xóa phân loại tài nguyên (chặn nếu đang có tài nguyên sử dụng)",
        tags: ["Resources"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Xóa thành công" }, 400: { description: "Phân loại đang được sử dụng" }, 404: { description: "Không tìm thấy phân loại" } }
      }
    },
    "/courses/categories": {
      get: {
        summary: "Danh sách phân loại khóa học",
        tags: ["Courses"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Danh sách phân loại" }, 401: { description: "Chưa xác thực" } }
      },
      post: {
        summary: "Tạo phân loại khóa học mới",
        tags: ["Courses"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Nâng hạng B2-C" }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Tạo phân loại thành công" }, 400: { description: "Trùng tên phân loại" } }
      }
    },
    "/courses/categories/{id}": {
      delete: {
        summary: "Xóa phân loại khóa học (chặn nếu đang có khóa học sử dụng)",
        tags: ["Courses"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Xóa thành công" }, 400: { description: "Phân loại đang được sử dụng" }, 404: { description: "Không tìm thấy phân loại" } }
      }
    },
    "/resources/{id}/bookings": {
      post: {
        summary: "Đặt lịch sử dụng tài nguyên (có kiểm tra trùng khung giờ)",
        tags: ["Resources"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["purpose", "by", "date", "startTime", "endTime"],
                properties: {
                  purpose: { type: "string", example: "Thực hành sa hình B2 (Khóa K32)" },
                  by: { type: "string", example: "Thầy Cường" },
                  date: { type: "string", example: "2026-07-10" },
                  startTime: { type: "string", example: "08:00" },
                  endTime: { type: "string", example: "11:30" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Đặt lịch thành công" }, 400: { description: "Trùng lịch hoặc dữ liệu không hợp lệ" } }
      }
    },
    "/batches": {
      get: {
        summary: "Danh sách lớp mở (batch) theo khóa học",
        tags: ["Batches"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "courseId", in: "query", schema: { type: "string" } },
          { name: "instructorId", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["Sắp khai giảng", "Đang học", "Đã kết thúc"] } },
          { name: "search", in: "query", schema: { type: "string" } }
        ],
        responses: { 200: { description: "Danh sách lớp (kèm thông tin khóa học, giảng viên)" }, 401: { description: "Chưa xác thực" } }
      },
      post: {
        summary: "Mở lớp mới cho một khóa học",
        tags: ["Batches"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["code", "courseId", "daysOfWeek", "startTime", "endTime", "startDate", "endDate"],
                properties: {
                  code: { type: "string", example: "K32" },
                  courseId: { type: "string", example: "665f1a2b3c4d5e6f70819202" },
                  instructorId: { type: "string", example: "665f1a2b3c4d5e6f70819203" },
                  daysOfWeek: { type: "array", items: { type: "number" }, example: [1, 3, 5], description: "0 = Chủ nhật ... 6 = Thứ 7" },
                  startTime: { type: "string", example: "18:00" },
                  endTime: { type: "string", example: "20:00" },
                  location: { type: "string", example: "Phòng 201" },
                  startDate: { type: "string", example: "2026-07-15" },
                  endDate: { type: "string", example: "2026-10-15" }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Mở lớp thành công" }, 400: { description: "Dữ liệu không hợp lệ hoặc trùng mã lớp" } }
      }
    },
    "/batches/{id}": {
      patch: {
        summary: "Cập nhật lớp (trạng thái, lịch học, gán giảng viên...)",
        tags: ["Batches"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Cập nhật thành công" }, 404: { description: "Không tìm thấy lớp" } }
      },
      delete: {
        summary: "Xóa lớp",
        tags: ["Batches"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Xóa thành công" }, 404: { description: "Không tìm thấy lớp" } }
      }
    },
    "/batches/{id}/learners": {
      post: {
        summary: "Gắn học viên vào lớp (kiểm tra sĩ số tối đa của khóa học)",
        tags: ["Batches"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["studentId"],
                properties: {
                  studentId: { type: "string", example: "665f1a2b3c4d5e6f70819204" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Gắn học viên thành công" }, 400: { description: "Học viên đã trong lớp hoặc lớp đầy" } }
      }
    },
    "/batches/{id}/learners/{studentId}": {
      delete: {
        summary: "Bỏ học viên khỏi lớp",
        tags: ["Batches"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "studentId", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: { 200: { description: "Bỏ học viên thành công" }, 400: { description: "Học viên không có trong lớp" } }
      }
    },
    "/schedule": {
      get: {
        summary: "Lịch tổng hợp: lớp học định kỳ + kỳ thi + booking tài nguyên trong khoảng ngày",
        tags: ["Schedule"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "from", in: "query", schema: { type: "string", example: "2026-07-01" } },
          { name: "to", in: "query", schema: { type: "string", example: "2026-07-31" } }
        ],
        responses: { 200: { description: "Danh sách sự kiện đã gộp, sắp xếp theo ngày" }, 401: { description: "Chưa xác thực" } }
      }
    },
  },
};

const options = {
  swaggerDefinition,
  apis: [], // No need to scan files, definition is completely hardcoded for maximum speed and control
};

export const swaggerSpec = swaggerJSDoc(options);
