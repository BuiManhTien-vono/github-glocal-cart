using Microsoft.EntityFrameworkCore;
using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Auth;
using GlocalCart.API.DTOs.Users;
using GlocalCart.API.Helpers;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Services.Implementations
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _db;

        public UserService(AppDbContext db) { _db = db; }

        public async Task<UserInfoDto> GetProfileAsync(int userId)
        {
            var user = await _db.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");
            return MapToUserInfo(user);
        }

        public async Task<UserInfoDto> UpdateProfileAsync(int userId, UpdateProfileDto dto)
        {
            var user = await _db.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

            if (dto.FullName != null) user.FullName = dto.FullName;
            if (dto.Phone != null) user.Phone = dto.Phone;
            user.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return MapToUserInfo(user);
        }

        public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto dto)
        {
            var user = await _db.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

            if (!PasswordHelper.VerifyPassword(dto.CurrentPassword, user.PasswordHash))
                throw new ArgumentException("Mật khẩu hiện tại không đúng.");

            user.PasswordHash = PasswordHelper.HashPassword(dto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ActivateSellerAsync(int userId)
        {
            var user = await _db.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

            if (user.IsSeller)
                throw new InvalidOperationException("Bạn đã là Seller rồi.");

            user.IsSeller = true;
            user.Role = Enums.UserRole.Seller;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        // === ADDRESSES ===
        public async Task<List<AddressDto>> GetAddressesAsync(int userId)
        {
            return await _db.UserAddresses
                .Where(a => a.UserId == userId)
                .Select(a => new AddressDto
                {
                    Id = a.Id, StreetAddress = a.StreetAddress, City = a.City,
                    State = a.State, Zipcode = a.Zipcode, Country = a.Country, IsDefault = a.IsDefault
                }).ToListAsync();
        }

        public async Task<AddressDto> CreateAddressAsync(int userId, CreateAddressDto dto)
        {
            // Nếu là địa chỉ mặc định, bỏ default của tất cả địa chỉ cũ
            if (dto.IsDefault)
            {
                var existingDefaults = await _db.UserAddresses
                    .Where(a => a.UserId == userId && a.IsDefault).ToListAsync();
                existingDefaults.ForEach(a => a.IsDefault = false);
            }

            var address = new UserAddress
            {
                UserId = userId, StreetAddress = dto.StreetAddress, City = dto.City,
                State = dto.State, Zipcode = dto.Zipcode, Country = dto.Country, IsDefault = dto.IsDefault
            };

            _db.UserAddresses.Add(address);
            await _db.SaveChangesAsync();

            return new AddressDto
            {
                Id = address.Id, StreetAddress = address.StreetAddress, City = address.City,
                State = address.State, Zipcode = address.Zipcode, Country = address.Country, IsDefault = address.IsDefault
            };
        }

        public async Task<AddressDto> UpdateAddressAsync(int userId, int addressId, CreateAddressDto dto)
        {
            var address = await _db.UserAddresses.FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy địa chỉ.");

            if (dto.IsDefault)
            {
                var existingDefaults = await _db.UserAddresses
                    .Where(a => a.UserId == userId && a.IsDefault && a.Id != addressId).ToListAsync();
                existingDefaults.ForEach(a => a.IsDefault = false);
            }

            address.StreetAddress = dto.StreetAddress;
            address.City = dto.City;
            address.State = dto.State;
            address.Zipcode = dto.Zipcode;
            address.Country = dto.Country;
            address.IsDefault = dto.IsDefault;

            await _db.SaveChangesAsync();

            return new AddressDto
            {
                Id = address.Id, StreetAddress = address.StreetAddress, City = address.City,
                State = address.State, Zipcode = address.Zipcode, Country = address.Country, IsDefault = address.IsDefault
            };
        }

        public async Task<bool> DeleteAddressAsync(int userId, int addressId)
        {
            var address = await _db.UserAddresses.FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy địa chỉ.");
            _db.UserAddresses.Remove(address);
            await _db.SaveChangesAsync();
            return true;
        }

        // === PAYMENT METHODS ===
        public async Task<PaymentMethodResponseDto> GetPaymentMethodsAsync(int userId)
        {
            var cards = await _db.CreditCards.Where(c => c.UserId == userId)
                .Select(c => new CreditCardResponseDto { Id = c.Id, NameOnCard = c.NameOnCard, CardNumberMasked = c.CardNumberMasked })
                .ToListAsync();

            var banks = await _db.BankAccounts.Where(b => b.UserId == userId)
                .Select(b => new BankAccountResponseDto { Id = b.Id, BankName = b.BankName, AccountNumberMasked = b.AccountNumberMasked })
                .ToListAsync();

            return new PaymentMethodResponseDto { CreditCards = cards, BankAccounts = banks };
        }

        public async Task<CreditCardResponseDto> AddCreditCardAsync(int userId, CreateCreditCardDto dto)
        {
            var masked = "****-****-****-" + dto.CardNumber[^4..];
            var card = new CreditCard
            {
                UserId = userId, NameOnCard = dto.NameOnCard, CardNumberMasked = masked,
                CodeEncrypted = dto.Code, // Trong thực tế cần mã hóa
                BillingStreet = dto.BillingStreet, BillingCity = dto.BillingCity,
                BillingState = dto.BillingState, BillingZip = dto.BillingZip, BillingCountry = dto.BillingCountry
            };
            _db.CreditCards.Add(card);
            await _db.SaveChangesAsync();
            return new CreditCardResponseDto { Id = card.Id, NameOnCard = card.NameOnCard, CardNumberMasked = card.CardNumberMasked };
        }

        public async Task<BankAccountResponseDto> AddBankAccountAsync(int userId, CreateBankAccountDto dto)
        {
            var masked = "****" + dto.AccountNumber[^4..];
            var bank = new BankAccount
            {
                UserId = userId, BankName = dto.BankName, RoutingNumber = dto.RoutingNumber, AccountNumberMasked = masked
            };
            _db.BankAccounts.Add(bank);
            await _db.SaveChangesAsync();
            return new BankAccountResponseDto { Id = bank.Id, BankName = bank.BankName, AccountNumberMasked = bank.AccountNumberMasked };
        }

        private static UserInfoDto MapToUserInfo(User user) => new()
        {
            Id = user.Id, UserName = user.UserName, Email = user.Email,
            FullName = user.FullName, Phone = user.Phone,
            Role = user.Role.ToString(), IsSeller = user.IsSeller,
            AccountStatus = user.AccountStatus.ToString()
        };
    }
}
