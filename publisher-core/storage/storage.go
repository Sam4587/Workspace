// Package storage 提供统一的文件存储抽象层
package storage

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// Storage 文件存储接口
type Storage interface {
	// Write 写入文件
	Write(ctx context.Context, path string, data []byte) error

	// WriteStream 流式写入
	WriteStream(ctx context.Context, path string, reader io.Reader) error

	// Read 读取文件
	Read(ctx context.Context, path string) ([]byte, error)

	// ReadStream 流式读取
	ReadStream(ctx context.Context, path string) (io.ReadCloser, error)

	// Delete 删除文件
	Delete(ctx context.Context, path string) error

	// Exists 检查文件是否存在
	Exists(ctx context.Context, path string) (bool, error)

	// Stat 获取文件信息
	Stat(ctx context.Context, path string) (*FileInfo, error)

	// List 列出文件
	List(ctx context.Context, prefix string) ([]string, error)

	// GetURL 获取访问URL
	GetURL(ctx context.Context, path string) (string, error)

	// GetSignedURL 获取带签名的访问URL(用于云存储)
	GetSignedURL(ctx context.Context, path string, expiry time.Duration) (string, error)
}

// FileInfo 文件信息
type FileInfo struct {
	Path      string
	Size      int64
	MimeType  string
	Hash      string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// StorageType 存储类型
type StorageType string

const (
	StorageTypeLocal StorageType = "local"
	StorageTypeS3    StorageType = "s3"
	StorageTypeOSS   StorageType = "oss"  // 阿里云OSS
	StorageTypeCOS   StorageType = "cos"  // 腾讯云COS
)

// Config 存储配置
type Config struct {
	Type      StorageType
	RootDir   string // 本地存储根目录
	Bucket    string // 云存储桶名
	Region    string // 云存储区域
	Endpoint  string // 云存储端点
	AccessKey string // 访问密钥
	SecretKey string // 密钥
	BaseURL   string // 基础URL
}

// LocalStorage 本地文件存储
type LocalStorage struct {
	rootDir string
	baseURL string
	mu      sync.RWMutex
}

// NewLocalStorage 创建本地存储
func NewLocalStorage(rootDir string, baseURL string) (*LocalStorage, error) {
	if rootDir == "" {
		rootDir = "./uploads"
	}

	// 确保目录存在
	if err := os.MkdirAll(rootDir, 0755); err != nil {
		return nil, fmt.Errorf("创建存储目录失败: %w", err)
	}

	return &LocalStorage{
		rootDir: rootDir,
		baseURL: baseURL,
	}, nil
}

// normalizePath 规范化路径
func (s *LocalStorage) normalizePath(path string) string {
	// 移除前导斜杠
	path = strings.TrimPrefix(path, "/")
	// 替换路径分隔符
	return filepath.FromSlash(path)
}

// resolvePath 解析安全路径
func (s *LocalStorage) resolvePath(path string) (string, error) {
	normalized := s.normalizePath(path)
	absPath := filepath.Join(s.rootDir, normalized)

	// 安全检查：确保路径在根目录内
	relPath, err := filepath.Rel(s.rootDir, absPath)
	if err != nil {
		return "", fmt.Errorf("无效路径: %w", err)
	}

	if strings.HasPrefix(relPath, "..") {
		return "", errors.New("路径超出存储根目录")
	}

	return absPath, nil
}

// Write 写入文件
func (s *LocalStorage) Write(ctx context.Context, path string, data []byte) error {
	absPath, err := s.resolvePath(path)
	if err != nil {
		return err
	}

	// 创建父目录
	if err := os.MkdirAll(filepath.Dir(absPath), 0755); err != nil {
		return fmt.Errorf("创建目录失败: %w", err)
	}

	// 写入文件
	if err := os.WriteFile(absPath, data, 0644); err != nil {
		return fmt.Errorf("写入文件失败: %w", err)
	}

	return nil
}

// WriteStream 流式写入
func (s *LocalStorage) WriteStream(ctx context.Context, path string, reader io.Reader) error {
	absPath, err := s.resolvePath(path)
	if err != nil {
		return err
	}

	// 创建父目录
	if err := os.MkdirAll(filepath.Dir(absPath), 0755); err != nil {
		return fmt.Errorf("创建目录失败: %w", err)
	}

	// 创建文件
	file, err := os.Create(absPath)
	if err != nil {
		return fmt.Errorf("创建文件失败: %w", err)
	}
	defer file.Close()

	// 复制数据
	if _, err := io.Copy(file, reader); err != nil {
		return fmt.Errorf("写入数据失败: %w", err)
	}

	return nil
}

// Read 读取文件
func (s *LocalStorage) Read(ctx context.Context, path string) ([]byte, error) {
	absPath, err := s.resolvePath(path)
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(absPath)
	if err != nil {
		return nil, fmt.Errorf("读取文件失败: %w", err)
	}

	return data, nil
}

// ReadStream 流式读取
func (s *LocalStorage) ReadStream(ctx context.Context, path string) (io.ReadCloser, error) {
	absPath, err := s.resolvePath(path)
	if err != nil {
		return nil, err
	}

	file, err := os.Open(absPath)
	if err != nil {
		return nil, fmt.Errorf("打开文件失败: %w", err)
	}

	return file, nil
}

// Delete 删除文件
func (s *LocalStorage) Delete(ctx context.Context, path string) error {
	absPath, err := s.resolvePath(path)
	if err != nil {
		return err
	}

	if err := os.Remove(absPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("删除文件失败: %w", err)
	}

	return nil
}

// Exists 检查文件是否存在
func (s *LocalStorage) Exists(ctx context.Context, path string) (bool, error) {
	absPath, err := s.resolvePath(path)
	if err != nil {
		return false, err
	}

	_, err = os.Stat(absPath)
	if os.IsNotExist(err) {
		return false, nil
	}
	if err != nil {
		return false, err
	}

	return true, nil
}

// Stat 获取文件信息
func (s *LocalStorage) Stat(ctx context.Context, path string) (*FileInfo, error) {
	absPath, err := s.resolvePath(path)
	if err != nil {
		return nil, err
	}

	stat, err := os.Stat(absPath)
	if err != nil {
		return nil, fmt.Errorf("获取文件信息失败: %w", err)
	}

	// 计算哈希
	data, err := os.ReadFile(absPath)
	if err != nil {
		return nil, err
	}
	hash := sha256.Sum256(data)

	return &FileInfo{
		Path:      path,
		Size:      stat.Size(),
		MimeType:  detectMimeType(absPath, data),
		Hash:      hex.EncodeToString(hash[:]),
		UpdatedAt: stat.ModTime(),
	}, nil
}

// List 列出文件
func (s *LocalStorage) List(ctx context.Context, prefix string) ([]string, error) {
	absPath, err := s.resolvePath(prefix)
	if err != nil {
		return nil, err
	}

	var files []string
	err = filepath.Walk(absPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			relPath, _ := filepath.Rel(s.rootDir, path)
			files = append(files, filepath.ToSlash(relPath))
		}
		return nil
	})

	return files, err
}

// GetURL 获取访问URL
func (s *LocalStorage) GetURL(ctx context.Context, path string) (string, error) {
	normalized := s.normalizePath(path)
	if s.baseURL != "" {
		return fmt.Sprintf("%s/%s", strings.TrimSuffix(s.baseURL, "/"), normalized), nil
	}
	return fmt.Sprintf("file://%s", filepath.Join(s.rootDir, normalized)), nil
}

// GetSignedURL 本地存储不支持签名URL
func (s *LocalStorage) GetSignedURL(ctx context.Context, path string, expiry time.Duration) (string, error) {
	return s.GetURL(ctx, path)
}

// detectMimeType 检测MIME类型
func detectMimeType(path string, data []byte) string {
	// 先通过内容检测
	mimeType := http.DetectContentType(data)
	if mimeType != "application/octet-stream" {
		return mimeType
	}

	// 再通过扩展名检测
	ext := filepath.Ext(path)
	if ext != "" {
		mimeType = mime.TypeByExtension(ext)
		if mimeType != "" {
			return mimeType
		}
	}

	return "application/octet-stream"
}

// ImageHelpers 图片辅助方法

// ImageToBase64 将图片转换为Base64
func ImageToBase64(storage Storage, ctx context.Context, path string) (string, error) {
	data, err := storage.Read(ctx, path)
	if err != nil {
		return "", err
	}

	info, err := storage.Stat(ctx, path)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("data:%s;base64,%s", info.MimeType, encodeBase64(data)), nil
}

// Base64ToImage 将Base64转换为图片并保存
func Base64ToImage(storage Storage, ctx context.Context, path string, base64Data string) error {
	// 解析Base64数据
	var data []byte
	if strings.HasPrefix(base64Data, "data:") {
		// 移除data:image/xxx;base64,前缀
		idx := strings.Index(base64Data, ",")
		if idx == -1 {
			return errors.New("无效的Base64数据")
		}
		data = decodeBase64(base64Data[idx+1:])
	} else {
		data = decodeBase64(base64Data)
	}

	return storage.Write(ctx, path, data)
}

// DownloadFile 从URL下载文件
func DownloadFile(storage Storage, ctx context.Context, path string, url string) error {
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return fmt.Errorf("创建请求失败: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("下载失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("下载失败: HTTP %d", resp.StatusCode)
	}

	return storage.WriteStream(ctx, path, resp.Body)
}

// Copy 复制文件
func Copy(storage Storage, ctx context.Context, src, dst string) error {
	data, err := storage.Read(ctx, src)
	if err != nil {
		return err
	}
	return storage.Write(ctx, dst, data)
}

// Move 移动文件
func Move(storage Storage, ctx context.Context, src, dst string) error {
	if err := Copy(storage, ctx, src, dst); err != nil {
		return err
	}
	return storage.Delete(ctx, src)
}

func encodeBase64(data []byte) string {
	return hex.EncodeToString(data)
}

func decodeBase64(s string) []byte {
	data, _ := hex.DecodeString(s)
	return data
}

// BufferStorage 内存缓冲存储(用于测试)
type BufferStorage struct {
	mu    sync.RWMutex
	files map[string]*bytes.Buffer
}

// NewBufferStorage 创建内存存储
func NewBufferStorage() *BufferStorage {
	return &BufferStorage{
		files: make(map[string]*bytes.Buffer),
	}
}

func (s *BufferStorage) Write(ctx context.Context, path string, data []byte) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.files[path] = bytes.NewBuffer(data)
	return nil
}

func (s *BufferStorage) WriteStream(ctx context.Context, path string, reader io.Reader) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	buf := &bytes.Buffer{}
	_, err := io.Copy(buf, reader)
	if err != nil {
		return err
	}
	s.files[path] = buf
	return nil
}

func (s *BufferStorage) Read(ctx context.Context, path string) ([]byte, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	buf, exists := s.files[path]
	if !exists {
		return nil, os.ErrNotExist
	}
	return buf.Bytes(), nil
}

func (s *BufferStorage) ReadStream(ctx context.Context, path string) (io.ReadCloser, error) {
	data, err := s.Read(ctx, path)
	if err != nil {
		return nil, err
	}
	return io.NopCloser(bytes.NewReader(data)), nil
}

func (s *BufferStorage) Delete(ctx context.Context, path string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.files, path)
	return nil
}

func (s *BufferStorage) Exists(ctx context.Context, path string) (bool, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	_, exists := s.files[path]
	return exists, nil
}

func (s *BufferStorage) Stat(ctx context.Context, path string) (*FileInfo, error) {
	data, err := s.Read(ctx, path)
	if err != nil {
		return nil, err
	}
	hash := sha256.Sum256(data)
	return &FileInfo{
		Path: path,
		Size: int64(len(data)),
		Hash: hex.EncodeToString(hash[:]),
	}, nil
}

func (s *BufferStorage) List(ctx context.Context, prefix string) ([]string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []string
	for path := range s.files {
		if strings.HasPrefix(path, prefix) {
			result = append(result, path)
		}
	}
	return result, nil
}

func (s *BufferStorage) GetURL(ctx context.Context, path string) (string, error) {
	return fmt.Sprintf("memory://%s", path), nil
}

func (s *BufferStorage) GetSignedURL(ctx context.Context, path string, expiry time.Duration) (string, error) {
	return s.GetURL(ctx, path)
}
