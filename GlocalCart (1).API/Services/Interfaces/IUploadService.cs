using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace GlocalCart.API.Services.Interfaces
{
    public interface IUploadService
    {
        Task<string> UploadAndCompressImageAsync(IFormFile file, string folderName);
    }
}
