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
          gasUrl: { type: "string" },
        },
      },
      Student: {
        type: "object",
        properties: {
          id: { type: "string" },
          fullName: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          rank: { type: "string", enum: ["A1", "A2", "B1", "B2", "C"] },
          area: { type: "string", enum: ["Nội thành", "Ngoại thành", "Tỉnh lân cận"] },
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
                  gasUrl: { type: "string", example: "https://script.google.com/macros/s/..." },
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
          { name: "area", in: "query", schema: { type: "string" } },
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
                required: ["fullName", "phone", "rank", "area", "registrationDate", "fee"],
                properties: {
                  fullName: { type: "string", example: "Nguyễn Văn Học Viên" },
                  phone: { type: "string", example: "0987654321" },
                  email: { type: "string", example: "hocvien@gmail.com" },
                  rank: { type: "string", enum: ["A1", "A2", "B1", "B2", "C"] },
                  area: { type: "string", enum: ["Nội thành", "Ngoại thành", "Tỉnh lân cận"] },
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
        summary: "Phân tích hồ sơ và lộ trình học viên bằng mô hình AI PiAPI",
        tags: ["AI Advisor"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fullName", "phone", "rank", "area", "registrationDate", "fee", "status"],
                properties: {
                  fullName: { type: "string", example: "Nguyễn Văn Học Viên" },
                  phone: { type: "string", example: "0987654321" },
                  rank: { type: "string", enum: ["A1", "A2", "B1", "B2", "C"] },
                  area: { type: "string", enum: ["Nội thành", "Ngoại thành", "Tỉnh lân cận"] },
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
  },
};

const options = {
  swaggerDefinition,
  apis: [], // No need to scan files, definition is completely hardcoded for maximum speed and control
};

export const swaggerSpec = swaggerJSDoc(options);
