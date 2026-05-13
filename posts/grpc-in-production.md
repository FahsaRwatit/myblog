---
title: gRPC 服务框架实战：从 proto 到生产
date: 2025-11-28
category: backend
excerpt: 记录在安全平台项目中落地 gRPC 服务的完整过程，包括 proto 设计、服务注册和踩坑记录。
---

# gRPC 服务框架实战

## 背景

在 enrich 插件的 SSH 日志富化需求中，我们需要批量查询 IP 归属信息。选择 gRPC 的原因：协议高效、强类型、支持流式传输。

## Proto 设计

```protobuf
syntax = "proto3";

service IpInfoService {
  rpc BatchIpInfoEnrich(BatchIpInfoRequest)
    returns (BatchIpInfoResponse);
}

message BatchIpInfoRequest {
  repeated string ips = 1;
}

message IpInfo {
  string ip      = 1;
  string country = 2;
  string city    = 3;
  string isp     = 4;
}
```

## 踩坑记录

### 坑 1：服务名不一致

grpc-service-framework 里注册的服务名要和 proto 里的 `package` + `service` 完全匹配，否则客户端报 `Unimplemented`。

### 坑 2：proto 类型不匹配

```go
// 错误：直接用 []string
resp.Results = ipList

// 正确：转换成 proto 类型
for _, ip := range ipList {
  resp.Results = append(resp.Results, &pb.IpInfo{Ip: ip})
}
```

## 结语

gRPC 的学习曲线主要在 proto 设计和类型系统上，一旦熟悉了，开发效率比 REST 高很多。
