/**
 * 请求重试工具
 * 提供指数退避重试机制
 */

async function retry(fn, options = {}) {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    maxDelay = 30000,
    onRetry = () => {},
    shouldRetry = () => true
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries - 1 && shouldRetry(error, attempt)) {
        const waitTime = Math.min(delay * Math.pow(backoff, attempt), maxDelay);
        onRetry(attempt + 1, error, waitTime);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}

function retryWithDefaults(fn, options = {}) {
  return retry(fn, {
    maxRetries: 3,
    delay: 500,
    backoff: 2,
    maxDelay: 10000,
    shouldRetry: (error) => {
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        return true;
      }
      if (error.response?.status >= 500) {
        return true;
      }
      if (error.response?.status === 429) {
        return true;
      }
      return false;
    },
    ...options
  });
}

module.exports = { retry, retryWithDefaults };
