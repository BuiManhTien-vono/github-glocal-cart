using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Auth;
using GlocalCart.API.DTOs.Users;
using GlocalCart.API.Enums;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Services.Implementations
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _db;
        private readonly UserManager<User> _userManager;

        public UserService(AppDbContext db, UserManager<User> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        public async Task<UserInfoDto> GetProfileAsync(int userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString())
                ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");
            var roles = await _userManager.GetRolesAsync(user);
            return MapToUserInfo(user, roles);
        }

        public async Task<UserInfoDto> UpdateProfileAsync(int userId, UpdateProfileDto dto)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

            user.FullName = dto.FullName!.Trim();
            user.PhoneNumber = dto.Phone!.Trim();
            user.Gender = string.IsNullOrWhiteSpace(dto.Gender) ? null : dto.Gender.Trim();
            user.DateOfBirth = dto.DateOfBirth?.Date;
            user.AvatarUrl = string.IsNullOrWhiteSpace(dto.AvatarUrl) ? null : dto.AvatarUrl.Trim();

            if (!string.IsNullOrWhiteSpace(dto.Email) && !string.Equals(user.Email, dto.Email.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                var email = dto.Email.Trim();
                var normalizedEmail = _userManager.NormalizeEmail(email);
                var exists = await _db.Users.AnyAsync(u => u.Id != user.Id && u.NormalizedEmail == normalizedEmail);
                if (exists)
                    throw new ArgumentException("Email đã được sử dụng.");

                user.Email = email;
                user.NormalizedEmail = normalizedEmail;
                user.EmailConfirmed = false;
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            var roles = await _userManager.GetRolesAsync(user);
            return MapToUserInfo(user, roles);
        }

        public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto dto)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString())
                ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new ArgumentException($"Đổi mật khẩu thất bại: {errors}");
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);
            return true;
        }

        public async Task<bool> ActivateSellerAsync(int userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString())
                ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

            if (user.IsSeller && await _userManager.IsInRoleAsync(user, "Seller"))
            {
                return true;
            }

            user.IsSeller = true;
            user.Role = UserRole.Seller;
            user.UpdatedAt = DateTime.UtcNow;

            if (!await _userManager.IsInRoleAsync(user, "Seller"))
            {
                var addRoleResult = await _userManager.AddToRoleAsync(user, "Seller");
                if (!addRoleResult.Succeeded)
                {
                    var errors = string.Join(", ", addRoleResult.Errors.Select(e => e.Description));
                    throw new InvalidOperationException($"Kích hoạt người bán thất bại: {errors}");
                }
            }

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Cập nhật tài khoản người bán thất bại: {errors}");
            }

            return true;
        }

        public async Task<bool> DeactivateSellerAsync(int userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString())
                ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

            if (!user.IsSeller && !await _userManager.IsInRoleAsync(user, "Seller"))
            {
                return true;
            }

            user.IsSeller = false;
            user.Role = UserRole.Member;
            user.UpdatedAt = DateTime.UtcNow;

            if (await _userManager.IsInRoleAsync(user, "Seller"))
            {
                var removeRoleResult = await _userManager.RemoveFromRoleAsync(user, "Seller");
                if (!removeRoleResult.Succeeded)
                {
                    var errors = string.Join(", ", removeRoleResult.Errors.Select(e => e.Description));
                    throw new InvalidOperationException($"Chuyển về người mua thất bại: {errors}");
                }
            }

            if (!await _userManager.IsInRoleAsync(user, "Member"))
            {
                var addMemberResult = await _userManager.AddToRoleAsync(user, "Member");
                if (!addMemberResult.Succeeded)
                {
                    var errors = string.Join(", ", addMemberResult.Errors.Select(e => e.Description));
                    throw new InvalidOperationException($"Cập nhật quyền người mua thất bại: {errors}");
                }
            }

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Cập nhật tài khoản người mua thất bại: {errors}");
            }

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

        private static UserInfoDto MapToUserInfo(User user, IList<string> roles) => new()
        {
            Id = user.Id, UserName = user.UserName!, Email = user.Email!,
            FullName = user.FullName, Phone = user.PhoneNumber,
            Gender = user.Gender, DateOfBirth = user.DateOfBirth, AvatarUrl = user.AvatarUrl,
            Role = roles.FirstOrDefault() ?? user.Role.ToString(), IsSeller = user.IsSeller,
            AccountStatus = user.AccountStatus.ToString()
        };
    }
}
